from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import os
from functools import wraps

from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)

# Load .env
load_dotenv()

# Create Flask app
app = Flask(__name__)

# JWT configuration
app.config["JWT_SECRET_KEY"] = os.getenv(
    "JWT_SECRET_KEY",
    "placement-portal-dev-secret-change-this"
)

jwt = JWTManager(app)

# ==========================================
# ADMIN-ONLY JWT ACCESS
# ==========================================

def admin_required():
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            claims = get_jwt()

            if claims.get("role") != "admin":
                return jsonify({
                    "error": "Admin access required."
                }), 403

            return fn(*args, **kwargs)

        return wrapper

    return decorator


# Allow React frontend to access Flask
CORS(app)


# ==========================================
# DATABASE CONNECTION
# ==========================================

def get_db_connection():

    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "placement_portal")
    )


# ==========================================
# HOME
# ==========================================

@app.route("/")
def home():

    return jsonify({
        "message": "Placement Portal API is running"
    })


# ==========================================
# STUDENT REGISTRATION
# ==========================================

@app.route("/api/auth/student/register", methods=["POST"])
def register_student():
    try:
        data = request.get_json() or {}

        name = str(data.get("studentName", "")).strip()
        email = str(data.get("email", "")).strip().lower()
        roll_number = str(data.get("rollNumber", "")).strip()
        prn = str(data.get("prn", "")).strip()
        department = str(data.get("department", "")).strip().upper()
        branch = str(data.get("branch", "")).strip()
        current_year_text = str(data.get("currentYear", "")).strip()
        cgpa = data.get("cgpa")
        backlogs = data.get("backlogs")
        phone = str(data.get("phone", "")).strip()
        password = str(data.get("password", ""))

        allowed_departments = {"MCA": 2, "IMCA": 5, "BCA": 3, "BBA": 3}

        if department not in allowed_departments:
            return jsonify({
                "error": "Department must be MCA, IMCA, BCA or BBA"
            }), 400

        required_values = [
            name, email, roll_number, prn, department,
            branch, current_year_text, phone, password
        ]

        if not all(required_values):
            return jsonify({
                "error": "Please fill all required fields"
            }), 400

        if len(password) < 8:
            return jsonify({
                "error": "Password must contain at least 8 characters"
            }), 400

        try:
            cgpa = float(cgpa)
        except (TypeError, ValueError):
            return jsonify({
                "error": "CGPA must be a valid number"
            }), 400

        if cgpa < 0 or cgpa > 10:
            return jsonify({
                "error": "CGPA must be between 0 and 10"
            }), 400

        try:
            backlogs = int(backlogs)
        except (TypeError, ValueError):
            return jsonify({
                "error": "Backlogs must be a valid number"
            }), 400

        if backlogs < 0:
            return jsonify({
                "error": "Backlogs cannot be negative"
            }), 400

        year_map = {
            "First Year": 1,
            "Second Year": 2,
            "Third Year": 3,
            "Fourth Year": 4,
            "Fifth Year": 5
        }

        current_year = year_map.get(current_year_text)

        if current_year is None:
            return jsonify({
                "error": "Invalid current year"
            }), 400

        if current_year > allowed_departments[department]:
            return jsonify({
                "error": f"{department} has only {allowed_departments[department]} years"
            }), 400

        password_hash = generate_password_hash(password)

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT id
            FROM students
            WHERE college_email = %s
               OR roll_number = %s
            LIMIT 1
            """,
            (email, roll_number)
        )

        if cursor.fetchone():
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Email or roll number already exists"
            }), 409

        # Check which optional columns exist in the current students table.
        cursor.execute(
            """
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'students'
            """
        )

        existing_columns = {row[0] for row in cursor.fetchall()}

        columns = [
            "student_name",
            "college_email",
            "roll_number",
            "department",
            "branch",
            "current_year",
            "phone_number",
            "password_hash",
            "placement_status"
        ]

        values = [
            name,
            email,
            roll_number,
            department,
            branch,
            current_year,
            phone,
            password_hash,
            "Unplaced"
        ]

        optional_fields = [
            ("prn", prn),
            ("cgpa", cgpa),
            ("backlogs", backlogs)
        ]

        for column, value in optional_fields:
            if column in existing_columns:
                columns.append(column)
                values.append(value)

        placeholders = ", ".join(["%s"] * len(columns))
        column_sql = ", ".join(columns)

        query = f"""
            INSERT INTO students ({column_sql})
            VALUES ({placeholders})
        """

        cursor.execute(query, tuple(values))
        connection.commit()

        student_id = cursor.lastrowid

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Student account created successfully",
            "student_id": student_id,
            "roll_number": roll_number
        }), 201

    except mysql.connector.IntegrityError as e:
        print("REGISTRATION DATABASE ERROR:", e)
        return jsonify({
            "error": "Email, roll number, PRN, or another unique student field already exists"
        }), 409

    except Exception as e:
        print("STUDENT REGISTRATION ERROR:", e)
        return jsonify({
            "error": str(e)
        }), 500


# ==========================================
# STUDENT LOGIN
# ==========================================

@app.route("/api/auth/student/login", methods=["POST"])
def student_login():
    try:
        data = request.get_json() or {}

        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("password", ""))

        if not email or not password:
            return jsonify({
                "error": "Email and password are required"
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT *
            FROM students
            WHERE college_email = %s
            LIMIT 1
            """,
            (email,)
        )

        student = cursor.fetchone()

        if not student:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Invalid email or password"
            }), 401

        if not check_password_hash(
            student.get("password_hash", ""),
            password
        ):
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Invalid email or password"
            }), 401

        # Never send the password hash to React.
        student.pop("password_hash", None)

        # Return a clean student object for the dashboard.
        student_data = {
            "id": student.get("id"),
            "studentName": student.get("student_name"),
            "email": student.get("college_email"),
            "rollNumber": student.get("roll_number"),
            "prn": student.get("prn"),
            "department": student.get("department"),
            "branch": student.get("branch"),
            "currentYear": student.get("current_year"),
            "cgpa": student.get("cgpa"),
            "backlogs": student.get("backlogs"),
            "phone": student.get("phone_number"),
            "placementStatus": student.get("placement_status")
        }

        # Create JWT token for the logged-in student.
        access_token = create_access_token(
            identity=str(student.get("id")),
            additional_claims={"role": "student"}
        )

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Login successful",
            "student": student_data,
            "access_token": access_token
        }), 200

    except Exception as e:
        print("STUDENT LOGIN ERROR:", e)
        return jsonify({
            "error": str(e)
        }), 500


# ==========================================
# GET ALL STUDENTS
# ==========================================

@app.route("/api/students", methods=["GET"])
@admin_required()
def get_students():

    try:

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT
                id,
                student_name AS name,
                college_email AS email,
                phone_number AS phone,
                department,
                current_year,
                placement_status AS status
            FROM students
            ORDER BY id DESC
        """

        cursor.execute(query)

        students = cursor.fetchall()

        cursor.close()
        connection.close()

        # Convert current_year to React-friendly year
        for student in students:

            if student["current_year"] == 1:
                student["year"] = f"{student['department']}-I"

            elif student["current_year"] == 2:
                student["year"] = f"{student['department']}-II"

            elif student["current_year"] == 3:
                student["year"] = f"{student['department']}-III"

            elif student["current_year"] == 4:
                student["year"] = f"{student['department']}-IV"

            elif student["current_year"] == 5:
                student["year"] = f"{student['department']}-V"

            else:
                student["year"] = str(student["current_year"])

            del student["current_year"]

        return jsonify(students), 200

    except Exception as e:

        print("GET STUDENTS ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500


# ==========================================
# ADD STUDENT
# ==========================================

@app.route("/api/students", methods=["POST"])
@admin_required()
def add_student():

    try:

        data = request.get_json()

        name = data.get("name")
        email = data.get("email")
        phone = data.get("phone")
        department = data.get("department")
        year = data.get("year")
        status = data.get("status")

        # ==================================
        # VALIDATION
        # ==================================

        if not name or not email or not phone:
            return jsonify({
                "error": "Name, email and phone are required"
            }), 400

        if not department or not year or not status:
            return jsonify({
                "error": "Department, year and status are required"
            }), 400

        department = str(department).strip().upper()
        allowed_departments = {"MCA": 2, "IMCA": 5, "BCA": 3, "BBA": 3}

        if department not in allowed_departments:
            return jsonify({
                "error": "Department must be MCA, IMCA, BCA or BBA"
            }), 400


        # ==================================
        # CONVERT YEAR
        # ==================================

        if "V" in year:
            current_year = 5

        elif "IV" in year:
            current_year = 4

        elif "III" in year:
            current_year = 3

        elif "II" in year:
            current_year = 2

        elif "I" in year:
            current_year = 1

        else:
            current_year = 1


        # ==================================
        # DATABASE CONNECTION
        # ==================================

        connection = get_db_connection()
        cursor = connection.cursor()


        # ==================================
        # GENERATE ROLL NUMBER
        # ==================================

        cursor.execute("SELECT COUNT(*) FROM students")

        count = cursor.fetchone()[0]

        roll_number = f"ADM{count + 1:04d}"


        # ==================================
        # BRANCH
        # ==================================

        branch = department


        # ==================================
        # DEFAULT PASSWORD
        # ==================================

        default_password = "Student@123"

        password_hash = generate_password_hash(
            default_password
        )


        # ==================================
        # INSERT STUDENT
        # ==================================

        query = """
            INSERT INTO students
            (
                student_name,
                college_email,
                roll_number,
                department,
                branch,
                current_year,
                phone_number,
                password_hash,
                placement_status
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
        """

        values = (
            name,
            email,
            roll_number,
            department,
            branch,
            current_year,
            phone,
            password_hash,
            status
        )

        cursor.execute(query, values)

        connection.commit()

        student_id = cursor.lastrowid

        cursor.close()
        connection.close()


        return jsonify({
            "message": "Student added successfully",
            "student_id": student_id,
            "roll_number": roll_number
        }), 201


    except mysql.connector.IntegrityError as e:

        print("DATABASE ERROR:", e)

        return jsonify({
            "error": "Email or roll number already exists"
        }), 409


    except Exception as e:

        print("ADD STUDENT ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500


# ==========================================
# UPDATE STUDENT
# ==========================================

@app.route(
    "/api/students/<int:student_id>",
    methods=["PUT"]
)
@admin_required()
def update_student(student_id):

    try:

        data = request.get_json()

        name = data.get("name")
        email = data.get("email")
        phone = data.get("phone")
        department = data.get("department")
        year = data.get("year")
        status = data.get("status")

        # ==================================
        # VALIDATION
        # ==================================

        if not name or not email or not phone:
            return jsonify({
                "error": "Name, email and phone are required"
            }), 400

        if not department or not year or not status:
            return jsonify({
                "error": "Department, year and status are required"
            }), 400

        department = str(department).strip().upper()
        allowed_departments = {"MCA": 2, "IMCA": 5, "BCA": 3, "BBA": 3}

        if department not in allowed_departments:
            return jsonify({
                "error": "Department must be MCA, IMCA, BCA or BBA"
            }), 400


        # ==================================
        # CONVERT YEAR
        # ==================================

        if "V" in year:
            current_year = 5

        elif "IV" in year:
            current_year = 4

        elif "III" in year:
            current_year = 3

        elif "II" in year:
            current_year = 2

        elif "I" in year:
            current_year = 1

        else:
            current_year = 1


        # ==================================
        # DATABASE CONNECTION
        # ==================================

        connection = get_db_connection()
        cursor = connection.cursor()


        # ==================================
        # UPDATE STUDENT
        # ==================================

        query = """
            UPDATE students
            SET
                student_name = %s,
                college_email = %s,
                phone_number = %s,
                department = %s,
                branch = %s,
                current_year = %s,
                placement_status = %s
            WHERE id = %s
        """

        values = (
            name,
            email,
            phone,
            department,
            department,
            current_year,
            status,
            student_id
        )

        cursor.execute(query, values)

        connection.commit()


        # ==================================
        # CHECK STUDENT
        # ==================================

        if cursor.rowcount == 0:

            cursor.close()
            connection.close()

            return jsonify({
                "error": "Student not found"
            }), 404


        cursor.close()
        connection.close()


        return jsonify({
            "message": "Student updated successfully"
        }), 200


    except mysql.connector.IntegrityError as e:

        print("DATABASE ERROR:", e)

        return jsonify({
            "error": "Email already exists"
        }), 409


    except Exception as e:

        print("UPDATE STUDENT ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500


# ==========================================
# DELETE STUDENT
# ==========================================

@app.route(
    "/api/students/<int:student_id>",
    methods=["DELETE"]
)
@admin_required()
def delete_student(student_id):

    try:

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            "DELETE FROM students WHERE id = %s",
            (student_id,)
        )

        connection.commit()

        if cursor.rowcount == 0:

            cursor.close()
            connection.close()

            return jsonify({
                "error": "Student not found"
            }), 404


        cursor.close()
        connection.close()


        return jsonify({
            "message": "Student deleted successfully"
        }), 200


    except Exception as e:

        print("DELETE ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500

# ==========================================
# GET ALL COMPANIES
# ==========================================

@app.route("/api/companies", methods=["GET"])
@jwt_required()
def get_companies():

    try:

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT
                id,
                company_name AS name,
                role AS industry,
                location,
                package_lpa AS package,
                openings,
                ctc,
                required_skills,
                minimum_cgpa,
                maximum_backlogs,
                eligible_branches,
                selection_process,
                application_deadline,
                company_description,
                is_active
            FROM companies
            ORDER BY id DESC
        """

        cursor.execute(query)

        companies = cursor.fetchall()

        cursor.close()
        connection.close()

        for company in companies:
            company["status"] = (
                "Active" if company["is_active"] == 1 else "Closed"
            )

            if company["package"] is not None:
                company["package"] = f"{company['package']} LPA"
            else:
                company["package"] = "Not specified"

        return jsonify(companies), 200

    except Exception as e:

        print("GET COMPANIES ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500


# ==========================================
# ADD COMPANY
# ==========================================

@app.route("/api/companies", methods=["POST"])
@jwt_required()
def add_company():

    try:
        data = request.get_json() or {}

        name = str(data.get("name", "")).strip()
        role = str(data.get("role") or data.get("industry") or "").strip()
        location = str(data.get("location", "")).strip()
        package = data.get("package")
        openings = data.get("openings")
        status = str(data.get("status", "Active")).strip()

        minimum_cgpa = data.get("minimum_cgpa")
        maximum_backlogs = data.get("maximum_backlogs")
        eligible_branches = str(data.get("eligible_branches", "")).strip()
        required_skills = str(data.get("required_skills", "")).strip()
        selection_process = str(data.get("selection_process", "")).strip()
        application_deadline = data.get("application_deadline")
        company_description = str(data.get("company_description", "")).strip()

        if not name or not role or not location or package in (None, ""):
            return jsonify({
                "error": "Company name, role, location and package are required"
            }), 400

        try:
            openings = int(openings)
            if openings < 0:
                raise ValueError
        except (ValueError, TypeError):
            return jsonify({
                "error": "Openings must be a non-negative number"
            }), 400

        try:
            package_lpa = float(
                str(package).upper().replace("LPA", "").strip()
            )
        except (ValueError, TypeError):
            return jsonify({
                "error": "Package must be a number such as 7 LPA"
            }), 400

        if minimum_cgpa in (None, ""):
            minimum_cgpa = None
        else:
            try:
                minimum_cgpa = float(minimum_cgpa)
                if minimum_cgpa < 0 or minimum_cgpa > 10:
                    raise ValueError
            except (ValueError, TypeError):
                return jsonify({
                    "error": "Minimum CGPA must be between 0 and 10"
                }), 400

        if maximum_backlogs in (None, ""):
            maximum_backlogs = None
        else:
            try:
                maximum_backlogs = int(maximum_backlogs)
                if maximum_backlogs < 0:
                    raise ValueError
            except (ValueError, TypeError):
                return jsonify({
                    "error": "Maximum backlogs must be a non-negative number"
                }), 400

        is_active = 1 if status == "Active" else 0

        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
            INSERT INTO companies
            (
                company_name,
                role,
                openings,
                location,
                package_lpa,
                minimum_cgpa,
                maximum_backlogs,
                eligible_branches,
                required_skills,
                selection_process,
                application_deadline,
                company_description,
                is_active
            )
            VALUES
            (
                %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s
            )
        """

        values = (
            name,
            role,
            openings,
            location,
            package_lpa,
            minimum_cgpa,
            maximum_backlogs,
            eligible_branches,
            required_skills,
            selection_process,
            application_deadline,
            company_description,
            is_active
        )

        cursor.execute(query, values)
        connection.commit()

        company_id = cursor.lastrowid

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Company added successfully",
            "company_id": company_id
        }), 201

    except Exception as e:
        print("ADD COMPANY ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500


# ==========================================
# DELETE COMPANY
# ==========================================

@app.route("/api/companies/<int:company_id>", methods=["DELETE"])
@jwt_required()
def delete_company(company_id):

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            "DELETE FROM companies WHERE id = %s",
            (company_id,)
        )

        connection.commit()

        if cursor.rowcount == 0:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Company not found"
            }), 404

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Company deleted successfully"
        }), 200

    except Exception as e:

        print("DELETE COMPANY ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500
        
        
# ==========================================
# UPDATE COMPANY
# ==========================================

@app.route("/api/companies/<int:company_id>", methods=["PUT"])
@jwt_required()
def update_company(company_id):

    try:
        data = request.get_json() or {}

        name = str(data.get("name", "")).strip()
        role = str(data.get("role") or data.get("industry") or "").strip()
        location = str(data.get("location", "")).strip()
        package = data.get("package")
        openings = data.get("openings")
        status = str(data.get("status", "Active")).strip()

        minimum_cgpa = data.get("minimum_cgpa")
        maximum_backlogs = data.get("maximum_backlogs")
        eligible_branches = str(data.get("eligible_branches", "")).strip()
        required_skills = str(data.get("required_skills", "")).strip()
        selection_process = str(data.get("selection_process", "")).strip()
        application_deadline = data.get("application_deadline")
        company_description = str(data.get("company_description", "")).strip()

        if not name or not role or not location or package in (None, ""):
            return jsonify({
                "error": "Company name, role, location and package are required"
            }), 400

        try:
            openings = int(openings)
            if openings < 0:
                raise ValueError
        except (ValueError, TypeError):
            return jsonify({
                "error": "Openings must be a non-negative number"
            }), 400

        try:
            package_lpa = float(
                str(package).upper().replace("LPA", "").strip()
            )
        except (ValueError, TypeError):
            return jsonify({
                "error": "Package must be a number such as 7 LPA"
            }), 400

        if minimum_cgpa in (None, ""):
            minimum_cgpa = None
        else:
            try:
                minimum_cgpa = float(minimum_cgpa)
                if minimum_cgpa < 0 or minimum_cgpa > 10:
                    raise ValueError
            except (ValueError, TypeError):
                return jsonify({
                    "error": "Minimum CGPA must be between 0 and 10"
                }), 400

        if maximum_backlogs in (None, ""):
            maximum_backlogs = None
        else:
            try:
                maximum_backlogs = int(maximum_backlogs)
                if maximum_backlogs < 0:
                    raise ValueError
            except (ValueError, TypeError):
                return jsonify({
                    "error": "Maximum backlogs must be a non-negative number"
                }), 400

        is_active = 1 if status == "Active" else 0

        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
            UPDATE companies
            SET
                company_name = %s,
                role = %s,
                location = %s,
                package_lpa = %s,
                openings = %s,
                minimum_cgpa = %s,
                maximum_backlogs = %s,
                eligible_branches = %s,
                required_skills = %s,
                selection_process = %s,
                application_deadline = %s,
                company_description = %s,
                is_active = %s
            WHERE id = %s
        """

        values = (
            name,
            role,
            location,
            package_lpa,
            openings,
            minimum_cgpa,
            maximum_backlogs,
            eligible_branches,
            required_skills,
            selection_process,
            application_deadline,
            company_description,
            is_active,
            company_id
        )

        cursor.execute(query, values)
        connection.commit()

        if cursor.rowcount == 0:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Company not found"
            }), 404

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Company updated successfully"
        }), 200

    except Exception as e:
        print("UPDATE COMPANY ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500


# ==========================================
# STUDENT APPLY FOR COMPANY
# ==========================================

@app.route("/api/applications", methods=["POST"])
@jwt_required()
def apply_for_company():

    try:
        data = request.get_json() or {}

        student_id = data.get("student_id")
        company_id = data.get("company_id")

        # Make sure a student can only apply as themselves.
        token_student_id = get_jwt_identity()

        if str(token_student_id) != str(student_id):
            return jsonify({
                "error": "You are not authorized to apply as another student."
            }), 403

        # ==================================
        # VALIDATION
        # ==================================

        if not student_id or not company_id:
            return jsonify({
                "error": "Student ID and Company ID are required"
            }), 400

        # ==================================
        # DATABASE CONNECTION
        # ==================================

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # ==================================
        # CHECK STUDENT
        # ==================================

        cursor.execute(
            """
            SELECT id
            FROM students
            WHERE id = %s
            """,
            (student_id,)
        )

        student = cursor.fetchone()

        if not student:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Student not found"
            }), 404

        # ==================================
        # CHECK COMPANY
        # ==================================

        cursor.execute(
            """
            SELECT id, company_name
            FROM companies
            WHERE id = %s
            """,
            (company_id,)
        )

        company = cursor.fetchone()

        if not company:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Company not found"
            }), 404

        # ==================================
        # CHECK DUPLICATE APPLICATION
        # ==================================

        cursor.execute(
            """
            SELECT id, status
            FROM applications
            WHERE student_id = %s
            AND company_id = %s
            """,
            (student_id, company_id)
        )

        existing_application = cursor.fetchone()

        if existing_application:

            cursor.close()
            connection.close()

            return jsonify({
                "error": "You have already applied to this company",
                "status": existing_application["status"]
            }), 409

        # ==================================
        # INSERT APPLICATION
        # ==================================

        cursor.execute(
            """
            INSERT INTO applications
            (
                student_id,
                company_id,
                status
            )
            VALUES
            (
                %s,
                %s,
                'Applied'
            )
            """,
            (student_id, company_id)
        )

        connection.commit()

        application_id = cursor.lastrowid

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Application submitted successfully",
            "application_id": application_id,
            "company_name": company["company_name"],
            "status": "Applied"
        }), 201

    except mysql.connector.IntegrityError as e:

        print("APPLICATION DATABASE ERROR:", e)

        return jsonify({
            "error": "Unable to submit application"
        }), 409

    except Exception as e:

        print("APPLICATION ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500
        
        
# ==========================================
# GET STUDENT APPLICATIONS
# ==========================================

@app.route("/api/applications/student/<int:student_id>", methods=["GET"])
def get_student_applications(student_id):

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT
                a.id,
                a.student_id,
                a.company_id,
                c.company_name,
                c.role,
                c.package_lpa,
                a.applied_at,
                a.status
            FROM applications a
            INNER JOIN companies c
                ON a.company_id = c.id
            WHERE a.student_id = %s
            ORDER BY a.id DESC
        """

        cursor.execute(query, (student_id,))

        applications = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify(applications), 200

    except Exception as e:

        print("GET STUDENT APPLICATIONS ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500
        
   # ==========================================
# GET ALL APPLICATIONS - ADMIN
# ==========================================

@app.route("/api/applications", methods=["GET"])
@jwt_required()
def get_all_applications():

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT
                a.id,
                a.student_id,
                a.company_id,
                s.student_name,
                s.college_email,
                c.company_name,
                c.role,
                c.package_lpa,
                a.applied_at,
                a.status
            FROM applications a
            INNER JOIN students s
                ON a.student_id = s.id
            INNER JOIN companies c
                ON a.company_id = c.id
            ORDER BY a.id DESC
        """

        cursor.execute(query)

        applications = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify(applications), 200

    except Exception as e:

        print("GET ALL APPLICATIONS ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500   
        
        
# ==========================================
# UPDATE APPLICATION STATUS - ADMIN
# ==========================================

@app.route("/api/applications/<int:application_id>/status", methods=["PUT"])
@jwt_required()
def update_application_status(application_id):

    try:
        data = request.get_json() or {}
        status = str(data.get("status", "")).strip()

        allowed_statuses = {
            "Applied",
            "Shortlisted",
            "Selected",
            "Rejected"
        }

        if status not in allowed_statuses:
            return jsonify({
                "error": "Invalid application status"
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
            UPDATE applications
            SET status = %s
            WHERE id = %s
        """

        cursor.execute(
            query,
            (status, application_id)
        )

        connection.commit()

        if cursor.rowcount == 0:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Application not found"
            }), 404

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Application status updated successfully",
            "application_id": application_id,
            "status": status
        }), 200

    except Exception as e:

        print("UPDATE APPLICATION STATUS ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500
        
   # ==========================================
# ADMIN LOGIN
# ==========================================

@app.route("/api/auth/admin/login", methods=["POST"])
def admin_login():

    try:
        data = request.get_json() or {}

        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("password", ""))

        if not email or not password:
            return jsonify({
                "error": "Email and password are required"
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                id,
                name,
                email,
                password_hash,
                phone
            FROM admins
            WHERE email = %s
            LIMIT 1
            """,
            (email,)
        )

        admin = cursor.fetchone()

        if not admin:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Invalid admin email or password"
            }), 401

        if not check_password_hash(
            admin.get("password_hash", ""),
            password
        ):
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Invalid admin email or password"
            }), 401

        admin_data = {
            "id": admin.get("id"),
            "name": admin.get("name"),
            "email": admin.get("email"),
            "phone": admin.get("phone")
        }

        # Create JWT access token for the logged-in admin.
        access_token = create_access_token(
            identity=str(admin.get("id")),
            additional_claims={"role": "admin"}
        )

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Admin login successful",
            "admin": admin_data,
            "access_token": access_token
        }), 200

    except Exception as e:

        print("ADMIN LOGIN ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500
    
  
# ==========================================
# ADMIN DASHBOARD STATISTICS
# ==========================================

@app.route("/api/admin/dashboard/stats", methods=["GET"])
@jwt_required()
def get_admin_dashboard_stats():

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Total Students
        cursor.execute("""
            SELECT COUNT(*) AS total_students
            FROM students
        """)
        total_students = cursor.fetchone()["total_students"]

        # Total Companies
        cursor.execute("""
            SELECT COUNT(*) AS total_companies
            FROM companies
        """)
        total_companies = cursor.fetchone()["total_companies"]

        # Total Applications
        cursor.execute("""
            SELECT COUNT(*) AS total_applications
            FROM applications
        """)
        total_applications = cursor.fetchone()["total_applications"]

        # Selected Students
        cursor.execute("""
            SELECT COUNT(*) AS selected_students
            FROM applications
            WHERE status = 'Selected'
        """)
        selected_students = cursor.fetchone()["selected_students"]

        # Shortlisted Applications
        cursor.execute("""
            SELECT COUNT(*) AS shortlisted_applications
            FROM applications
            WHERE status = 'Shortlisted'
        """)
        shortlisted_applications = cursor.fetchone()["shortlisted_applications"]

        # Applied Applications
        cursor.execute("""
            SELECT COUNT(*) AS applied_applications
            FROM applications
            WHERE status = 'Applied'
        """)
        applied_applications = cursor.fetchone()["applied_applications"]

        # Rejected Applications
        cursor.execute("""
            SELECT COUNT(*) AS rejected_applications
            FROM applications
            WHERE status = 'Rejected'
        """)
        rejected_applications = cursor.fetchone()["rejected_applications"]

        cursor.close()
        connection.close()

        return jsonify({
            "total_students": total_students,
            "total_companies": total_companies,
            "total_applications": total_applications,
            "selected_students": selected_students,
            "shortlisted_applications": shortlisted_applications,
            "applied_applications": applied_applications,
            "rejected_applications": rejected_applications
        }), 200

    except Exception as e:

        print("ADMIN DASHBOARD STATS ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500
          
# ==========================================
# ADMIN REGISTRATION
# ==========================================

@app.route("/api/auth/admin/register", methods=["POST"])
def register_admin():

    try:
        data = request.get_json() or {}

        name = str(data.get("name", "")).strip()
        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("password", ""))
        phone = str(data.get("phone", "")).strip()

        if not name or not email or not password:
            return jsonify({
                "error": "Name, email and password are required"
            }), 400

        if len(password) < 8:
            return jsonify({
                "error": "Password must contain at least 8 characters"
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT id
            FROM admins
            WHERE email = %s
            LIMIT 1
            """,
            (email,)
        )

        existing_admin = cursor.fetchone()

        if existing_admin:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Admin email already exists"
            }), 409

        password_hash = generate_password_hash(password)

        cursor.execute(
            """
            INSERT INTO admins
            (
                name,
                email,
                password_hash,
                phone
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s
            )
            """,
            (
                name,
                email,
                password_hash,
                phone
            )
        )

        connection.commit()

        admin_id = cursor.lastrowid

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Admin registered successfully",
            "admin_id": admin_id
        }), 201

    except mysql.connector.IntegrityError:

        return jsonify({
            "error": "Admin email already exists"
        }), 409

    except Exception as e:

        print("ADMIN REGISTRATION ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500
     
# ==========================================
# ADMIN MONTHLY PLACEMENT STATISTICS
# ==========================================

@app.route("/api/admin/dashboard/monthly-stats", methods=["GET"])
@jwt_required()
def get_monthly_stats():

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT
                DATE_FORMAT(a.applied_at, '%b') AS month,
                COUNT(*) AS placements
            FROM applications a
            WHERE a.status = 'Selected'
              AND a.applied_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY
                YEAR(a.applied_at),
                MONTH(a.applied_at),
                DATE_FORMAT(a.applied_at, '%b')
            ORDER BY
                YEAR(a.applied_at),
                MONTH(a.applied_at)
        """

        cursor.execute(query)

        monthly_stats = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify(monthly_stats), 200

    except Exception as e:
        print("MONTHLY STATS ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500
        
        # ==========================================
# ADMIN DEPARTMENT PLACEMENT STATISTICS
# ==========================================

@app.route("/api/admin/dashboard/department-stats", methods=["GET"])
@jwt_required()
def get_department_stats():

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT
                s.department,
                COUNT(DISTINCT s.id) AS students,
                COUNT(
                    DISTINCT CASE
                        WHEN a.status = 'Selected'
                        THEN s.id
                    END
                ) AS placed
            FROM students s
            LEFT JOIN applications a
                ON s.id = a.student_id
            GROUP BY s.department
            ORDER BY
                CASE s.department
                    WHEN 'MCA' THEN 1
                    WHEN 'BCA' THEN 2
                    WHEN 'IMCA' THEN 3
                    WHEN 'BBA' THEN 4
                    ELSE 5
                END
        """

        cursor.execute(query)

        department_stats = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify(department_stats), 200

    except Exception as e:

        print("DEPARTMENT STATS ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500
        
        
        
        
# ==========================================
# ADMIN QUIZ APIs
# ==========================================

@app.route("/api/admin/quizzes", methods=["GET"])
def get_quizzes():

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT
                id,
                title,
                category,
                description,
                total_questions,
                duration_minutes,
                negative_marking,
                negative_marks,
                is_active,
                created_at
            FROM quizzes
            ORDER BY id DESC
        """

        cursor.execute(query)

        quizzes = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify(quizzes), 200

    except Exception as e:

        print("GET QUIZZES ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500


# ==========================================
# CREATE QUIZ
# ==========================================

@app.route("/api/admin/quizzes", methods=["POST"])
def create_quiz():

    try:

        data = request.get_json() or {}

        title = str(data.get("title", "")).strip()
        category = str(data.get("category", "")).strip()
        description = str(data.get("description", "")).strip()

        duration_minutes = data.get("duration_minutes", 30)

        allowed_categories = {
            "Aptitude",
            "Logical Reasoning",
            "SQL",
            "Python",
            "Java",
            "C++",
            "Excel",
            "Power BI",
            "Statistics",
            "Data Analytics"
        }

        if not title:
            return jsonify({
                "error": "Quiz title is required."
            }), 400

        if category not in allowed_categories:
            return jsonify({
                "error": "Invalid quiz category."
            }), 400

        try:
            duration_minutes = int(duration_minutes)
        except (TypeError, ValueError):
            return jsonify({
                "error": "Duration must be a number."
            }), 400

        if duration_minutes <= 0:
            return jsonify({
                "error": "Duration must be greater than 0."
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
            INSERT INTO quizzes
            (
                title,
                category,
                description,
                duration_minutes
            )
            VALUES (%s, %s, %s, %s)
        """

        cursor.execute(
            query,
            (
                title,
                category,
                description,
                duration_minutes
            )
        )

        connection.commit()

        quiz_id = cursor.lastrowid

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Quiz created successfully.",
            "quiz_id": quiz_id
        }), 201

    except Exception as e:

        print("CREATE QUIZ ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500


# ==========================================
# GET QUESTIONS FOR A QUIZ
# ==========================================

@app.route("/api/admin/quizzes/<int:quiz_id>/questions", methods=["GET"])
def get_quiz_questions(quiz_id):

    try:

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT
                id,
                quiz_id,
                question_text,
                option_a,
                option_b,
                option_c,
                option_d,
                correct_answer,
                marks,
                topic
            FROM questions
            WHERE quiz_id = %s
            ORDER BY id DESC
        """

        cursor.execute(query, (quiz_id,))

        questions = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify(questions), 200

    except Exception as e:

        print("GET QUIZ QUESTIONS ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500


# ==========================================
# CREATE QUESTION
# ==========================================

@app.route(
    "/api/admin/quizzes/<int:quiz_id>/questions",
    methods=["POST"]
)
def create_question(quiz_id):

    try:

        data = request.get_json() or {}

        question_text = str(
            data.get("question_text", "")
        ).strip()

        option_a = str(
            data.get("option_a", "")
        ).strip()

        option_b = str(
            data.get("option_b", "")
        ).strip()

        option_c = str(
            data.get("option_c", "")
        ).strip()

        option_d = str(
            data.get("option_d", "")
        ).strip()

        correct_answer = str(
            data.get("correct_answer", "")
        ).strip().upper()

        marks = data.get("marks", 1)

        topic = str(
            data.get("topic", "")
        ).strip()

        if not question_text:
            return jsonify({
                "error": "Question is required."
            }), 400

        if not option_a or not option_b or not option_c or not option_d:
            return jsonify({
                "error": "All four options are required."
            }), 400

        if correct_answer not in {"A", "B", "C", "D"}:
            return jsonify({
                "error": "Correct answer must be A, B, C or D."
            }), 400

        # Check quiz exists
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT id
            FROM quizzes
            WHERE id = %s
            """,
            (quiz_id,)
        )

        quiz = cursor.fetchone()

        if not quiz:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Quiz not found."
            }), 404

        cursor.close()

        # Insert question
        cursor = connection.cursor()

        query = """
            INSERT INTO questions
            (
                quiz_id,
                question_text,
                option_a,
                option_b,
                option_c,
                option_d,
                correct_answer,
                marks,
                topic
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        cursor.execute(
            query,
            (
                quiz_id,
                question_text,
                option_a,
                option_b,
                option_c,
                option_d,
                correct_answer,
                marks,
                topic
            )
        )

        # Update total question count
        cursor.execute(
            """
            UPDATE quizzes
            SET total_questions = (
                SELECT COUNT(*)
                FROM questions
                WHERE quiz_id = %s
            )
            WHERE id = %s
            """,
            (quiz_id, quiz_id)
        )

        connection.commit()

        question_id = cursor.lastrowid

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Question created successfully.",
            "question_id": question_id
        }), 201

    except Exception as e:

        print("CREATE QUESTION ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500
        

# ==========================================
# STUDENT SUBMIT QUIZ
# ==========================================

@app.route(
    "/api/student/quizzes/<int:quiz_id>/submit",
    methods=["POST"]
)
def submit_quiz(quiz_id):

    try:
        data = request.get_json() or {}

        student_id = data.get("student_id")
        answers = data.get("answers", {})

        if not student_id:
            return jsonify({
                "error": "Student ID is required."
            }), 400

        if not isinstance(answers, dict):
            return jsonify({
                "error": "Invalid answers format."
            }), 400

        connection = get_db_connection()

        # ----------------------------------
        # Get quiz
        # ----------------------------------

        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                id,
                title,
                negative_marking,
                negative_marks
            FROM quizzes
            WHERE id = %s
            """,
            (quiz_id,)
        )

        quiz = cursor.fetchone()

        if not quiz:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Quiz not found."
            }), 404

        # ----------------------------------
        # Get questions
        # ----------------------------------

        cursor.execute(
            """
            SELECT
                id,
                correct_answer,
                marks
            FROM questions
            WHERE quiz_id = %s
            ORDER BY id
            """,
            (quiz_id,)
        )

        questions = cursor.fetchall()

        cursor.close()

        if not questions:
            connection.close()

            return jsonify({
                "error": "This quiz has no questions."
            }), 400

        # ----------------------------------
        # Calculate result
        # ----------------------------------

        correct_answers = 0
        wrong_answers = 0
        unanswered = 0

        score = 0
        total_marks = 0

        for question in questions:

            question_id = str(question["id"])

            marks = float(question["marks"] or 0)

            total_marks += marks

            submitted_answer = answers.get(question_id)

            correct_answer = str(
                question["correct_answer"]
            ).upper()

            # Unanswered
            if not submitted_answer:
                unanswered += 1
                continue

            submitted_answer = str(
                submitted_answer
            ).upper()

            # Correct
            if submitted_answer == correct_answer:

                correct_answers += 1
                score += marks

            # Wrong
            else:

                wrong_answers += 1

                if quiz["negative_marking"]:
                    score -= float(
                        quiz["negative_marks"] or 0
                    )

        # ----------------------------------
        # Accuracy
        # ----------------------------------

        attempted = correct_answers + wrong_answers

        if attempted > 0:
            accuracy = (
                correct_answers / attempted
            ) * 100
        else:
            accuracy = 0

        # ----------------------------------
        # Time taken
        # ----------------------------------

        time_taken_seconds = int(
            data.get("time_taken_seconds", 0) or 0
        )

        # ----------------------------------
        # Save result
        # ----------------------------------

        cursor = connection.cursor()

        insert_query = """
            INSERT INTO quiz_results
            (
                student_id,
                quiz_id,
                score,
                total_marks,
                correct_answers,
                wrong_answers,
                unanswered,
                accuracy,
                time_taken_seconds
            )
            VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s
            )
        """

        cursor.execute(
            insert_query,
            (
                student_id,
                quiz_id,
                score,
                total_marks,
                correct_answers,
                wrong_answers,
                unanswered,
                accuracy,
                time_taken_seconds
            )
        )

        connection.commit()

        result_id = cursor.lastrowid

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Quiz submitted successfully.",
            "result_id": result_id,
            "quiz_id": quiz_id,
            "quiz_title": quiz["title"],
            "score": round(score, 2),
            "total_marks": round(total_marks, 2),
            "correct_answers": correct_answers,
            "wrong_answers": wrong_answers,
            "unanswered": unanswered,
            "accuracy": round(accuracy, 2),
            "time_taken_seconds": time_taken_seconds
        }), 200

    except Exception as e:

        print("SUBMIT QUIZ ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500
        
# ==========================================
# ACTIVATE / DEACTIVATE QUIZ
# ==========================================

@app.route(
    "/api/admin/quizzes/<int:quiz_id>/status",
    methods=["PUT"]
)
def update_quiz_status(quiz_id):

    try:
        data = request.get_json() or {}

        is_active = data.get("is_active")

        if is_active not in [True, False, 0, 1]:
            return jsonify({
                "error": "is_active must be true or false."
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE quizzes
            SET is_active = %s
            WHERE id = %s
            """,
            (bool(is_active), quiz_id)
        )

        connection.commit()

        if cursor.rowcount == 0:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Quiz not found."
            }), 404

        cursor.close()
        connection.close()

        return jsonify({
            "message": (
                "Quiz activated successfully."
                if bool(is_active)
                else "Quiz deactivated successfully."
            ),
            "quiz_id": quiz_id,
            "is_active": bool(is_active)
        }), 200

    except Exception as e:

        print("UPDATE QUIZ STATUS ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500
        
# ==========================================
# GET STUDENT QUIZ RESULTS
# ==========================================

@app.route(
    "/api/student/quiz-results/<int:student_id>",
    methods=["GET"]
)
@jwt_required()
def get_student_quiz_results(student_id):

    try:

        token_student_id = get_jwt_identity()

        if str(token_student_id) != str(student_id):
            return jsonify({
                "error": "You are not authorized to view another student's quiz results."
            }), 403

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT
                qr.id,
                qr.student_id,
                qr.quiz_id,
                q.title AS quiz_title,
                q.category,
                qr.score,
                qr.total_marks,
                qr.correct_answers,
                qr.wrong_answers,
                qr.unanswered,
                qr.accuracy,
                qr.time_taken_seconds,
                qr.attempted_at
            FROM quiz_results qr
            INNER JOIN quizzes q
                ON qr.quiz_id = q.id
            WHERE qr.student_id = %s
            ORDER BY qr.attempted_at DESC
        """

        cursor.execute(query, (student_id,))

        results = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify(results), 200

    except Exception as e:

        print("GET STUDENT QUIZ RESULTS ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500
        
     
# ==========================================
# DELETE STUDENT QUIZ RESULT
# ==========================================

@app.route(
    "/api/student/quiz-results/<int:result_id>",
    methods=["DELETE"]
)
@jwt_required()
def delete_student_quiz_result(result_id):

    try:
        token_student_id = get_jwt_identity()

        connection = get_db_connection()
        cursor = connection.cursor()

        # Check whether result exists and belongs to logged-in student
        cursor.execute(
            """
            SELECT id, student_id
            FROM quiz_results
            WHERE id = %s
            """,
            (result_id,)
        )

        result = cursor.fetchone()

        if not result:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Quiz result not found."
            }), 404

        if str(result[1]) != str(token_student_id):
            cursor.close()
            connection.close()

            return jsonify({
                "error": "You are not authorized to delete another student's quiz result."
            }), 403

        # Delete result
        cursor.execute(
            """
            DELETE FROM quiz_results
            WHERE id = %s
            """,
            (result_id,)
        )

        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Quiz result deleted successfully.",
            "result_id": result_id
        }), 200

    except Exception as e:

        print("DELETE QUIZ RESULT ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500
        
# ==========================================
# STUDENT QUIZ ANALYTICS
# ==========================================

@app.route(
    "/api/student/quiz-analytics/<int:student_id>",
    methods=["GET"]
)
@jwt_required()
def get_student_quiz_analytics(student_id):

    try:
        token_student_id = get_jwt_identity()

        if str(token_student_id) != str(student_id):
            return jsonify({
                "error": "You are not authorized to view another student's quiz analytics."
            }), 403

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # ------------------------------------------
        # Overall Quiz Statistics
        # ------------------------------------------

        cursor.execute(
            """
            SELECT
                COUNT(*) AS total_quizzes_attempted,
                COALESCE(AVG(score), 0) AS average_score,
                COALESCE(AVG(accuracy), 0) AS average_accuracy,
                COALESCE(MAX(score), 0) AS best_score
            FROM quiz_results
            WHERE student_id = %s
            """,
            (student_id,)
        )

        statistics = cursor.fetchone()

        # ------------------------------------------
        # Recent Quiz Results
        # ------------------------------------------

        cursor.execute(
            """
            SELECT
                qr.id,
                qr.quiz_id,
                q.title AS quiz_title,
                q.category,
                qr.score,
                qr.total_marks,
                qr.accuracy,
                qr.correct_answers,
                qr.wrong_answers,
                qr.unanswered,
                qr.time_taken_seconds,
                qr.attempted_at
            FROM quiz_results qr
            INNER JOIN quizzes q
                ON qr.quiz_id = q.id
            WHERE qr.student_id = %s
            ORDER BY qr.attempted_at DESC
            LIMIT 5
            """,
            (student_id,)
        )

        recent_results = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify({
            "statistics": {
                "total_quizzes_attempted":
                    statistics["total_quizzes_attempted"] or 0,

                "average_score":
                    round(float(statistics["average_score"] or 0), 2),

                "average_accuracy":
                    round(float(statistics["average_accuracy"] or 0), 2),

                "best_score":
                    round(float(statistics["best_score"] or 0), 2)
            },

            "recent_results": recent_results
        }), 200

    except Exception as e:

        print("STUDENT QUIZ ANALYTICS ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500
        

# ==========================================
# UPDATE STUDENT PROFILE
# ==========================================

@app.route(
    "/api/student/profile/<int:student_id>",
    methods=["PUT"]
)
@jwt_required()
def update_student_profile(student_id):

    try:
        token_student_id = get_jwt_identity()

        if str(token_student_id) != str(student_id):
            return jsonify({
                "error": "You are not authorized to update another student's profile."
            }), 403

        data = request.get_json() or {}

        branch = str(
            data.get("branch", "")
        ).strip()

        current_year = data.get("currentYear")
        cgpa = data.get("cgpa")
        backlogs = data.get("backlogs")
        phone = str(
            data.get("phone", "")
        ).strip()

        # ------------------------------------------
        # Validation
        # ------------------------------------------

        if not branch:
            return jsonify({
                "error": "Branch is required."
            }), 400

        try:
            current_year = int(current_year)
        except (TypeError, ValueError):
            return jsonify({
                "error": "Current year must be a valid number."
            }), 400

        if current_year < 1 or current_year > 5:
            return jsonify({
                "error": "Current year must be between 1 and 5."
            }), 400

        try:
            cgpa = float(cgpa)
        except (TypeError, ValueError):
            return jsonify({
                "error": "CGPA must be a valid number."
            }), 400

        if cgpa < 0 or cgpa > 10:
            return jsonify({
                "error": "CGPA must be between 0 and 10."
            }), 400

        try:
            backlogs = int(backlogs)
        except (TypeError, ValueError):
            return jsonify({
                "error": "Backlogs must be a valid number."
            }), 400

        if backlogs < 0:
            return jsonify({
                "error": "Backlogs cannot be negative."
            }), 400

        if not phone:
            return jsonify({
                "error": "Phone number is required."
            }), 400

        # ------------------------------------------
        # Database connection
        # ------------------------------------------

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # ------------------------------------------
        # Check student exists
        # ------------------------------------------

        cursor.execute(
            """
            SELECT id
            FROM students
            WHERE id = %s
            """,
            (student_id,)
        )

        student = cursor.fetchone()

        if not student:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Student not found."
            }), 404

        # ------------------------------------------
        # Update profile
        # ------------------------------------------

        cursor.execute(
            """
            UPDATE students
            SET
                branch = %s,
                current_year = %s,
                cgpa = %s,
                backlogs = %s,
                phone_number = %s
            WHERE id = %s
            """,
            (
                branch,
                current_year,
                cgpa,
                backlogs,
                phone,
                student_id
            )
        )

        connection.commit()

        # ------------------------------------------
        # Get updated student data
        # ------------------------------------------

        cursor.execute(
            """
            SELECT
                id,
                student_name,
                college_email,
                roll_number,
                prn,
                department,
                branch,
                current_year,
                cgpa,
                backlogs,
                phone_number,
                placement_status
            FROM students
            WHERE id = %s
            """,
            (student_id,)
        )

        updated_student = cursor.fetchone()

        cursor.close()
        connection.close()

        # Convert database fields to frontend fields
        student_data = {
            "id": updated_student["id"],
            "studentName": updated_student["student_name"],
            "email": updated_student["college_email"],
            "rollNumber": updated_student["roll_number"],
            "prn": updated_student["prn"],
            "department": updated_student["department"],
            "branch": updated_student["branch"],
            "currentYear": updated_student["current_year"],
            "cgpa": updated_student["cgpa"],
            "backlogs": updated_student["backlogs"],
            "phone": updated_student["phone_number"],
            "placementStatus": updated_student["placement_status"]
        }

        return jsonify({
            "message": "Student profile updated successfully.",
            "student": student_data
        }), 200

    except Exception as e:

        print(
            "UPDATE STUDENT PROFILE ERROR:",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500
        
        
        
                                      
# ==========================================
# NOTIFICATION APIs
# ==========================================

@app.route("/api/admin/notifications", methods=["POST"])
@jwt_required()
def create_notification():
    try:
        data = request.get_json() or {}

        admin_id = data.get("admin_id")
        token_admin_id = get_jwt_identity()
        student_id = data.get("student_id")
        send_to_all = bool(data.get("send_to_all", False))

        title = str(data.get("title", "")).strip()
        message = str(data.get("message", "")).strip()
        notification_type = str(
            data.get("notification_type", "Quiz")
        ).strip()

        if not admin_id:
            return jsonify({
                "error": "Admin ID is required."
            }), 400

        if str(token_admin_id) != str(admin_id):
            return jsonify({
                "error": "You are not authorized to send notifications as another admin."
            }), 403

        if not title or not message:
            return jsonify({
                "error": "Title and message are required."
            }), 400

        if not send_to_all and not student_id:
            return jsonify({
                "error": "Student ID is required when sending to one student."
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check admin exists
        cursor.execute(
            """
            SELECT id
            FROM admins
            WHERE id = %s
            LIMIT 1
            """,
            (admin_id,)
        )

        admin = cursor.fetchone()

        if not admin:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Admin not found."
            }), 404

        # Send notification to all students
        if send_to_all:
            cursor.execute(
                """
                SELECT id
                FROM students
                ORDER BY id
                """
            )

            students = cursor.fetchall()

            if not students:
                cursor.close()
                connection.close()

                return jsonify({
                    "error": "No students found."
                }), 404

            insert_query = """
                INSERT INTO notifications
                (
                    student_id,
                    admin_id,
                    title,
                    message,
                    notification_type,
                    is_read
                )
                VALUES (%s, %s, %s, %s, %s, 0)
            """

            values = [
                (
                    student["id"],
                    admin_id,
                    title,
                    message,
                    notification_type
                )
                for student in students
            ]

            cursor.executemany(insert_query, values)
            connection.commit()

            notification_count = len(values)

            cursor.close()
            connection.close()

            return jsonify({
                "message": "Notification sent to all students successfully.",
                "notifications_created": notification_count
            }), 201

        # Send notification to one student
        cursor.execute(
            """
            SELECT id
            FROM students
            WHERE id = %s
            LIMIT 1
            """,
            (student_id,)
        )

        student = cursor.fetchone()

        if not student:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Student not found."
            }), 404

        cursor.execute(
            """
            INSERT INTO notifications
            (
                student_id,
                admin_id,
                title,
                message,
                notification_type,
                is_read
            )
            VALUES (%s, %s, %s, %s, %s, 0)
            """,
            (
                student_id,
                admin_id,
                title,
                message,
                notification_type
            )
        )

        connection.commit()
        notification_id = cursor.lastrowid

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Notification sent successfully.",
            "notification_id": notification_id
        }), 201

    except Exception as e:
        print("CREATE NOTIFICATION ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500


# ==========================================
# GET STUDENT NOTIFICATIONS
# ==========================================

@app.route(
    "/api/notifications/student/<int:student_id>",
    methods=["GET"]
)
@jwt_required()
def get_student_notifications(student_id):
    try:
        
        token_student_id = get_jwt_identity()

        if str(token_student_id) != str(student_id):
            return jsonify({
                "error": "You are not authorized to view another student's notifications."
            }), 403

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Remove notifications that were already read more than 24 hours ago.
        # Unread notifications are never removed by this cleanup.
        cursor.execute(
            """
            DELETE FROM notifications
            WHERE student_id = %s
              AND is_read = 1
              AND read_at IS NOT NULL
              AND read_at <= (NOW() - INTERVAL 1 DAY)
            """,
            (student_id,)
        )

        connection.commit()

        cursor.execute(
            """
            SELECT
                id,
                student_id,
                admin_id,
                title,
                message,
                notification_type,
                is_read,
                created_at,
                read_at
            FROM notifications
            WHERE student_id = %s
            ORDER BY created_at DESC, id DESC
            """,
            (student_id,)
        )

        notifications = cursor.fetchall()

        cursor.close()
        connection.close()

        for notification in notifications:
            if notification.get("created_at"):
                notification["created_at"] = (
                    notification["created_at"].isoformat()
                )

            if notification.get("read_at"):
                notification["read_at"] = (
                    notification["read_at"].isoformat()
                )

        return jsonify(notifications), 200

    except Exception as e:
        print("GET STUDENT NOTIFICATIONS ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500


# ==========================================
# MARK NOTIFICATION AS READ
# ==========================================

@app.route(
    "/api/notifications/<int:notification_id>/read",
    methods=["PUT"]
)
@jwt_required()
def mark_notification_as_read(notification_id):
    try:
        token_student_id = get_jwt_identity()

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Make sure the notification belongs to the logged-in student.
        cursor.execute(
            """
            SELECT id, student_id, is_read, read_at
            FROM notifications
            WHERE id = %s
            LIMIT 1
            """,
            (notification_id,)
        )

        notification = cursor.fetchone()

        if not notification:
            cursor.close()
            connection.close()

            return jsonify({
                "error": "Notification not found."
            }), 404

        if str(notification["student_id"]) != str(token_student_id):
            cursor.close()
            connection.close()

            return jsonify({
                "error": "You are not authorized to update another student's notification."
            }), 403

        # Mark as read and start the 24-hour countdown.
        # If an older notification was already marked read before read_at
        # was added, initialize read_at now so it can also expire correctly.
        if not notification["is_read"] or notification["read_at"] is None:
            cursor.execute(
                """
                UPDATE notifications
                SET is_read = 1,
                    read_at = COALESCE(read_at, NOW())
                WHERE id = %s
                """,
                (notification_id,)
            )

            connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Notification marked as read.",
            "notification_id": notification_id,
            "read_at": "saved"
        }), 200

    except Exception as e:
        print("MARK NOTIFICATION READ ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500
# ==========================================
# ADMIN CHANGE PASSWORD
# ==========================================

@app.route("/api/auth/admin/change-password", methods=["PUT"])
def admin_change_password():

    try:
        data = request.get_json() or {}

        admin_id = data.get("admin_id")
        current_password = data.get("current_password")
        new_password = data.get("new_password")

        # Validate input
        if not admin_id or not current_password or not new_password:
            return jsonify({
                "message": "All password fields are required."
            }), 400

        # Get database connection
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Find admin
        cursor.execute(
            """
            SELECT id, password_hash
            FROM admins
            WHERE id = %s
            LIMIT 1
            """,
            (admin_id,)
        )

        admin = cursor.fetchone()

        # Admin not found
        if not admin:
            cursor.close()
            connection.close()

            return jsonify({
                "message": "Admin not found."
            }), 404

        # Check current password
        if not check_password_hash(
            admin["password_hash"],
            current_password
        ):
            cursor.close()
            connection.close()

            return jsonify({
                "message": "Current password is incorrect."
            }), 401

        # Generate new password hash
        new_password_hash = generate_password_hash(
            new_password
        )

        # Update password
        cursor.execute(
            """
            UPDATE admins
            SET password_hash = %s
            WHERE id = %s
            """,
            (
                new_password_hash,
                admin_id
            )
        )

        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Password updated successfully."
        }), 200

    except Exception as e:

        print("ADMIN CHANGE PASSWORD ERROR:", e)

        return jsonify({
            "message": "Failed to change password.",
            "error": str(e)
        }), 500
   
   
# ==========================================
# ADMIN NOTIFICATION PREFERENCES
# ==========================================

@app.route(
    "/api/auth/admin/notification-preferences",
    methods=["GET"]
)
@jwt_required()
def get_admin_notification_preferences():

    try:
        admin_id = request.args.get("admin_id")
        token_admin_id = get_jwt_identity()

        if not admin_id:
            return jsonify({
                "message": "Admin ID is required."
            }), 400

        if str(token_admin_id) != str(admin_id):
            return jsonify({
                "message": "You are not authorized to access another admin's notification preferences."
            }), 403

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                system_notifications,
                email_notifications
            FROM admins
            WHERE id = %s
            LIMIT 1
            """,
            (admin_id,)
        )

        preferences = cursor.fetchone()

        cursor.close()
        connection.close()

        if not preferences:
            return jsonify({
                "message": "Admin not found."
            }), 404

        return jsonify({
            "system_notifications": bool(
                preferences["system_notifications"]
            ),
            "email_notifications": bool(
                preferences["email_notifications"]
            )
        }), 200

    except Exception as e:

        print(
            "GET ADMIN NOTIFICATION PREFERENCES ERROR:",
            e
        )

        return jsonify({
            "message": "Failed to get notification preferences.",
            "error": str(e)
        }), 500


@app.route(
    "/api/auth/admin/notification-preferences",
    methods=["PUT"]
)
@jwt_required()
def update_admin_notification_preferences():

    try:
        data = request.get_json() or {}

        admin_id = data.get("admin_id")
        token_admin_id = get_jwt_identity()

        system_notifications = data.get(
            "system_notifications"
        )
        email_notifications = data.get(
            "email_notifications"
        )

        if admin_id is None:
            return jsonify({
                "message": "Admin ID is required."
            }), 400

        if str(token_admin_id) != str(admin_id):
            return jsonify({
                "message": "You are not authorized to update another admin's notification preferences."
            }), 403

        if system_notifications is None:
            return jsonify({
                "message": "System notification setting is required."
            }), 400

        if email_notifications is None:
            return jsonify({
                "message": "Email notification setting is required."
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE admins
            SET
                system_notifications = %s,
                email_notifications = %s
            WHERE id = %s
            """,
            (
                1 if system_notifications else 0,
                1 if email_notifications else 0,
                admin_id
            )
        )

        connection.commit()

        if cursor.rowcount == 0:
            cursor.close()
            connection.close()

            return jsonify({
                "message": "Admin not found."
            }), 404

        cursor.close()
        connection.close()

        return jsonify({
            "message": "Notification preferences updated successfully."
        }), 200

    except Exception as e:

        print(
            "UPDATE ADMIN NOTIFICATION PREFERENCES ERROR:",
            e
        )

        return jsonify({
            "message": "Failed to update notification preferences.",
            "error": str(e)
        }), 500
             
# ==========================================
# RUN SERVER
# ==========================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )

