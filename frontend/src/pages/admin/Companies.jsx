import { useEffect, useState } from "react";

import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaFilter,
} from "react-icons/fa";

function Companies() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showFilter, setShowFilter] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [viewingCompany, setViewingCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAdminToken = () => {
    return (
      localStorage.getItem("admin_access_token") ||
      sessionStorage.getItem("admin_access_token")
    );
  };


  const emptyCompany = {
    name: "",
    industry: "",
    location: "",
    package: "",
    openings: "",
    minimum_cgpa: "",
    maximum_backlogs: "",
    eligible_branches: "",
    required_skills: "",
    application_deadline: "",
    selection_process: "",
    company_description: "",
    status: "Active",
  };

  const [newCompany, setNewCompany] = useState(emptyCompany);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "http://127.0.0.1:5000/api/companies",
        {
          headers: {
            Authorization: `Bearer ${getAdminToken()}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Admin session expired or token is missing. Please login again."
          );
        }

        throw new Error(
          data.error || "Failed to fetch companies"
        );
      }

      setCompanies(data);
    } catch (error) {
      console.error("Error fetching companies:", error);
      alert("Cannot connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setNewCompany({
      ...newCompany,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();

    if (
      !newCompany.name ||
      !newCompany.industry ||
      !newCompany.location ||
      !newCompany.package ||
      !newCompany.openings
    ) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/companies",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAdminToken()}`,
          },
          body: JSON.stringify(newCompany),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to add company"
        );
      }

      alert("Company added successfully!");

      setNewCompany(emptyCompany);
      setShowModal(false);
      fetchCompanies();
    } catch (error) {
      console.error("Error adding company:", error);
      alert(error.message);
    }
  };

  const handleView = (company) => {
    setViewingCompany(company);
  };

  const handleEdit = (company) => {
    setEditingCompanyId(company.id);

    const packageValue =
      company.package && company.package !== "Not specified"
        ? String(company.package).replace(/LPA/gi, "").trim()
        : "";

    setNewCompany({
      name: company.name || "",
      industry: company.industry || "",
      location: company.location || "",
      package: packageValue,
      openings: company.openings ?? "",
      minimum_cgpa: company.minimum_cgpa ?? "",
      maximum_backlogs: company.maximum_backlogs ?? "",
      eligible_branches: company.eligible_branches || "",
      required_skills: company.required_skills || "",
      application_deadline: company.application_deadline
        ? String(company.application_deadline).slice(0, 10)
        : "",
      selection_process: company.selection_process || "",
      company_description: company.company_description || "",
      status: company.status || "Active",
    });

    setShowModal(true);
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();

    if (
      !newCompany.name ||
      !newCompany.industry ||
      !newCompany.location ||
      !newCompany.package ||
      !newCompany.openings
    ) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/companies/${editingCompanyId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAdminToken()}`,
          },
          body: JSON.stringify(newCompany),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update company"
        );
      }

      alert("Company updated successfully!");

      setNewCompany(emptyCompany);
      setEditingCompanyId(null);
      setShowModal(false);
      fetchCompanies();
    } catch (error) {
      console.error("Error updating company:", error);
      alert(error.message);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this company?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/companies/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAdminToken()}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete company"
        );
      }

      alert("Company deleted successfully!");
      fetchCompanies();
    } catch (error) {
      console.error("Error deleting company:", error);
      alert(error.message);
    }
  };

  const filteredCompanies = companies.filter((company) => {
    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      !searchText ||
      (company.name || "").toLowerCase().includes(searchText) ||
      (company.industry || "").toLowerCase().includes(searchText) ||
      (company.location || "").toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "All" ||
      company.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">

      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Companies
          </h1>

          <p className="text-sm text-gray-500">
            Manage companies and placement opportunities
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCompanyId(null);
            setNewCompany(emptyCompany);
            setShowModal(true);
          }}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <FaPlus />
          Add Company
        </button>
      </div>

      {/* STATS */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Companies</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-800">
            {companies.length}
          </h2>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Active Companies</p>
          <h2 className="mt-2 text-2xl font-bold text-green-600">
            {
              companies.filter(
                (company) => company.status === "Active"
              ).length
            }
          </h2>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Openings</p>
          <h2 className="mt-2 text-2xl font-bold text-blue-600">
            {companies.reduce(
              (total, company) =>
                total + Number(company.openings || 0),
              0
            )}
          </h2>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Industries</p>
          <h2 className="mt-2 text-2xl font-bold text-purple-600">
            {
              new Set(
                companies.map(
                  (company) => company.industry
                )
              ).size
            }
          </h2>
        </div>
      </div>

      {/* SEARCH / FILTER */}
      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              placeholder="Search company, role or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilter((prev) => !prev)}
            className={`flex items-center justify-center gap-2 rounded-lg border px-5 py-3 font-medium transition ${
              showFilter || statusFilter !== "All"
                ? "border-blue-500 bg-blue-50 text-blue-600"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <FaFilter />
            Filter
            {statusFilter !== "All" && (
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                1
              </span>
            )}
          </button>
        </div>

        {showFilter && (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="text-sm font-semibold text-gray-700">
                Company Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              >
                <option value="All">All Companies</option>
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
              }}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
            >
              Clear Filters
            </button>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>
            Showing{" "}
            <span className="font-semibold text-gray-700">
              {filteredCompanies.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-700">
              {companies.length}
            </span>{" "}
            companies
          </span>

          {(search || statusFilter !== "All") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
              }}
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* COMPANY TABLE */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Company
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Industry / Role
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Location
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Package
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Openings
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Status
                </th>

                <th className="px-6 py-4 text-center text-xs font-semibold uppercase text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    Loading companies...
                  </td>
                </tr>
              ) : filteredCompanies.length > 0 ? (
                filteredCompanies.map((company) => (
                  <tr
                    key={company.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">
                        {company.name}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {company.industry}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {company.location}
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                      {company.package}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {company.openings}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          company.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {company.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          title="View"
                          onClick={() => handleView(company)}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <FaEye />
                        </button>

                        <button
                          title="Edit"
                          onClick={() => handleEdit(company)}
                          className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                        >
                          <FaEdit />
                        </button>

                        <button
                          title="Delete"
                          onClick={() =>
                            handleDelete(company.id)
                          }
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No companies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW COMPANY MODAL */}
      {viewingCompany && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-sm sm:p-5">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                  <FaEye />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-800 sm:text-xl">
                    Company Details
                  </h2>
                  <p className="text-xs text-slate-500 sm:text-sm">
                    Complete placement opportunity information
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingCompany(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            {/* BODY */}
            <div className="min-h-0 overflow-y-auto bg-slate-50 p-5 sm:p-7">

              {/* COMPANY SUMMARY */}
              <div className="mb-5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">
                      {viewingCompany.name || "Company"}
                    </h3>

                    <p className="mt-1 text-blue-100">
                      {viewingCompany.industry || "Job Role not specified"}
                    </p>

                    <p className="mt-2 text-sm text-blue-100">
                      {viewingCompany.location || "Location not specified"}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-4 py-2 text-xs font-bold ${
                      viewingCompany.status === "Active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {viewingCompany.status || "Unknown"}
                  </span>
                </div>
              </div>

              {/* KEY DETAILS */}
              <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="h-8 w-1 rounded-full bg-blue-600" />
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      Placement Details
                    </h3>
                    <p className="text-xs text-slate-500">
                      Key information about this opportunity
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-500">
                      Package
                    </p>
                    <p className="mt-1 font-bold text-slate-800">
                      {viewingCompany.package || "Not specified"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-500">
                      Openings
                    </p>
                    <p className="mt-1 font-bold text-slate-800">
                      {viewingCompany.openings ?? "Not specified"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-500">
                      Minimum CGPA
                    </p>
                    <p className="mt-1 font-bold text-slate-800">
                      {viewingCompany.minimum_cgpa ?? "Not specified"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-500">
                      Max Backlogs
                    </p>
                    <p className="mt-1 font-bold text-slate-800">
                      {viewingCompany.maximum_backlogs ?? "Not specified"}
                    </p>
                  </div>
                </div>
              </section>

              {/* ELIGIBILITY */}
              <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="h-8 w-1 rounded-full bg-emerald-500" />
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      Eligibility & Application
                    </h3>
                    <p className="text-xs text-slate-500">
                      Student eligibility requirements
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs font-medium text-slate-500">
                      Eligible Branches
                    </p>
                    <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                      {viewingCompany.eligible_branches || "Not specified"}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium text-slate-500">
                      Application Deadline
                    </p>
                    <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                      {viewingCompany.application_deadline
                        ? String(viewingCompany.application_deadline).slice(0, 10)
                        : "Not specified"}
                    </div>
                  </div>
                </div>
              </section>

              {/* SKILLS */}
              <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-8 w-1 rounded-full bg-violet-500" />
                  <h3 className="font-semibold text-slate-800">
                    Required Skills
                  </h3>
                </div>

                <div className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {viewingCompany.required_skills || "No specific skills listed."}
                </div>
              </section>

              {/* SELECTION PROCESS */}
              <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-8 w-1 rounded-full bg-orange-500" />
                  <h3 className="font-semibold text-slate-800">
                    Selection Process
                  </h3>
                </div>

                <div className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-line">
                  {viewingCompany.selection_process || "Selection process not specified."}
                </div>
              </section>

              {/* DESCRIPTION */}
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-8 w-1 rounded-full bg-slate-500" />
                  <h3 className="font-semibold text-slate-800">
                    Company Description
                  </h3>
                </div>

                <div className="rounded-lg bg-slate-50 p-4 text-sm leading-7 text-slate-700 whitespace-pre-line">
                  {viewingCompany.company_description || "No company description available."}
                </div>
              </section>
            </div>

            {/* FOOTER */}
            <div className="flex shrink-0 justify-end border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
              <button
                type="button"
                onClick={() => setViewingCompany(null)}
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD COMPANY MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-sm sm:p-5">
          <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/30 bg-white shadow-2xl">

            {/* HEADER */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                  {editingCompanyId ? <FaEdit /> : <FaPlus />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 sm:text-xl">
                    {editingCompanyId ? "Edit Company" : "Add Company"}
                  </h2>
                  <p className="text-xs text-slate-500 sm:text-sm">
                    {editingCompanyId
                      ? "Update placement opportunity details"
                      : "Create a new placement opportunity"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingCompanyId(null);
                  setNewCompany(emptyCompany);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            {/* BODY */}
            <form
              onSubmit={
                editingCompanyId
                  ? handleUpdateCompany
                  : handleAddCompany
              }
              className="min-h-0 overflow-y-auto bg-slate-50/70"
            >
              <div className="space-y-5 p-5 sm:p-7">

                {/* BASIC INFORMATION */}
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="h-8 w-1 rounded-full bg-blue-600" />
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        Basic Information
                      </h3>
                      <p className="text-xs text-slate-500">
                        Enter company and job information
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        placeholder="e.g. TCS"
                        value={newCompany.name}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Job Role <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="industry"
                        placeholder="e.g. Software Developer"
                        value={newCompany.industry}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Location <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="location"
                        placeholder="e.g. Pune, Mumbai"
                        value={newCompany.location}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Package (LPA) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="package"
                        placeholder="e.g. 6"
                        value={newCompany.package}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Number of Openings <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        name="openings"
                        placeholder="e.g. 20"
                        value={newCompany.openings}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Application Deadline
                      </label>
                      <input
                        type="date"
                        name="application_deadline"
                        value={newCompany.application_deadline}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>
                  </div>
                </section>

                {/* ELIGIBILITY */}
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="h-8 w-1 rounded-full bg-emerald-500" />
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        Eligibility Criteria
                      </h3>
                      <p className="text-xs text-slate-500">
                        Define who can apply
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Minimum CGPA
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        name="minimum_cgpa"
                        placeholder="e.g. 6.5"
                        value={newCompany.minimum_cgpa}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Maximum Backlogs
                      </label>
                      <input
                        type="number"
                        min="0"
                        name="maximum_backlogs"
                        placeholder="e.g. 2"
                        value={newCompany.maximum_backlogs}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Eligible Branches
                      </label>
                      <input
                        type="text"
                        name="eligible_branches"
                        placeholder="e.g. MCA, BCA, BBA"
                        value={newCompany.eligible_branches}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>
                  </div>
                </section>

                {/* JOB & SELECTION */}
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="h-8 w-1 rounded-full bg-violet-500" />
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        Job & Selection Details
                      </h3>
                      <p className="text-xs text-slate-500">
                        Add skills and hiring process
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Required Skills
                      </label>
                      <input
                        type="text"
                        name="required_skills"
                        placeholder="e.g. Python, SQL, React, Communication"
                        value={newCompany.required_skills}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Selection Process
                      </label>
                      <textarea
                        name="selection_process"
                        rows="3"
                        placeholder="e.g. Aptitude → Technical Interview → HR Interview"
                        value={newCompany.selection_process}
                        onChange={handleChange}
                        className="w-full resize-none rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Company Description
                      </label>
                      <textarea
                        name="company_description"
                        rows="4"
                        placeholder="Enter company and job description..."
                        value={newCompany.company_description}
                        onChange={handleChange}
                        className="w-full resize-none rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>
                  </div>
                </section>

                {/* STATUS */}
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-800">
                    Application Status
                  </h3>
                  <p className="mb-3 text-xs text-slate-500">
                    Choose whether students can see this opportunity
                  </p>

                  <select
                    name="status"
                    value={newCompany.status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="Active">Active</option>
                    <option value="Closed">Closed</option>
                  </select>
                </section>
              </div>

              {/* FOOTER */}
              <div className="sticky bottom-0 flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 shadow-[0_-4px_12px_rgba(15,23,42,0.05)] sm:px-7">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCompanyId(null);
                    setNewCompany(emptyCompany);
                  }}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                >
                  {editingCompanyId ? "Update Company" : "Add Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Companies;
