from flask import Flask
from sqlalchemy import text

from app.config.config import Config
from app.extensions import db, jwt, cors


def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app)

    @app.route("/")
    def home():
        return {
            "success": True,
            "message": "Placement Preparation & Analytics Portal API is running!"
        }

    @app.route("/api/test-db")
    def test_db():
        try:
            db.session.execute(text("SELECT 1"))

            return {
                "success": True,
                "message": "MySQL database connected successfully!"
            }

        except Exception as e:
            return {
                "success": False,
                "message": "Database connection failed",
                "error": str(e)
            }, 500

    return app