"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import type { Role } from "@/lib/auth/session";

export default function RegisterForm() {
  const router = useRouter();
  
  // Common fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("student");
  
  // Student fields
  const [studentClass, setStudentClass] = useState("");
  const [studentSection, setStudentSection] = useState("");
  
  // Teacher fields
  const [employeeId, setEmployeeId] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  
  // Parent fields
  const [numberOfChildren, setNumberOfChildren] = useState(1);
  const [parentIds, setParentIds] = useState<string[]>([""]); // Array of parent IDs from student records
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    return email.includes("@") && email.length > 3;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (!fullName.trim()) {
      setError("Full name is required");
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address (must contain @)");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Role-specific validation
    if (role === "student") {
      // Registration number is auto-assigned by database trigger
      if (!studentClass.trim()) {
        setError("Class is required for students");
        setLoading(false);
        return;
      }
      if (!studentSection.trim()) {
        setError("Section is required for students");
        setLoading(false);
        return;
      }
    }

    if (role === "teacher") {
      if (!employeeId.trim()) {
        setError("Employee ID is required for teachers");
        setLoading(false);
        return;
      }
      if (!department.trim()) {
        setError("Department is required for teachers");
        setLoading(false);
        return;
      }
      if (!designation.trim()) {
        setError("Designation is required for teachers");
        setLoading(false);
        return;
      }
    }

    if (role === "parent") {
      // Validate all parent IDs are filled
      const validParentIds = parentIds.filter(id => id.trim() !== "");
      if (validParentIds.length === 0) {
        setError("At least one Parent ID is required. You must have valid parent IDs from your children's student records.");
        setLoading(false);
        return;
      }
      if (validParentIds.length !== numberOfChildren) {
        setError(`Please enter Parent IDs for all ${numberOfChildren} child${numberOfChildren > 1 ? 'ren' : ''}.`);
        setLoading(false);
        return;
      }
      if (!phoneNumber.trim()) {
        setError("Phone number is required for parents");
        setLoading(false);
        return;
      }
      if (!address.trim()) {
        setError("Address is required for parents");
        setLoading(false);
        return;
      }
    }

    // Prepare form data
    const formData = {
      full_name: fullName,
      email: email,
      password: password, // In production, this should be hashed
      role: role,
      // Role-specific data
      ...(role === "student" && {
        class: studentClass,
        section: studentSection,
        // registration_number and parent_id are auto-assigned by database triggers
      }),
      ...(role === "teacher" && {
        employee_id: employeeId,
        department: department,
        designation: designation,
      }),
      ...(role === "parent" && {
        parent_ids: parentIds.filter(id => id.trim() !== ""), // Array of parent IDs: must exist in students table
        phone_number: phoneNumber,
        address: address,
      }),
    };

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error ?? "Failed to create account. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err) {
      console.error("Registration error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mt-8 rounded-md bg-green-50 p-6 dark:bg-green-900/20">
        <p className="text-center text-sm text-green-800 dark:text-green-200">
          Account created successfully! Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label htmlFor="full-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Full Name
          </label>
          <input
            id="full-name"
            name="full-name"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-500 sm:text-sm"
            placeholder="Enter your full name"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-500 sm:text-sm"
            placeholder="your.email@example.com"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-500 sm:text-sm"
            placeholder="Minimum 6 characters"
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Confirm Password
          </label>
          <input
            id="confirm-password"
            name="confirm-password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-500 sm:text-sm"
            placeholder="Confirm your password"
          />
        </div>

        {/* Role */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Role
          </label>
          <select
            id="role"
            name="role"
            required
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-zinc-900 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700 dark:focus:ring-zinc-500 sm:text-sm"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="parent">Parent</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Student-specific fields */}
        {role === "student" && (
          <>
            <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Note: Registration number will be automatically assigned when your account is created.
              </p>
            </div>
            <div>
              <label htmlFor="class" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Class *
              </label>
              <input
                id="class"
                name="class"
                type="text"
                required
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-500 sm:text-sm"
                placeholder="e.g., Grade 10, Class A"
              />
            </div>
            <div>
              <label htmlFor="section" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Section *
              </label>
              <input
                id="section"
                name="section"
                type="text"
                required
                value={studentSection}
                onChange={(e) => setStudentSection(e.target.value)}
                className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-500 sm:text-sm"
                placeholder="e.g., Section B"
              />
            </div>
          </>
        )}

        {/* Teacher-specific fields */}
        {role === "teacher" && (
          <>
            <div>
              <label htmlFor="employee-id" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Employee ID *
              </label>
              <input
                id="employee-id"
                name="employee-id"
                type="text"
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-500 sm:text-sm"
                placeholder="Enter employee ID"
              />
            </div>
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Department *
              </label>
              <input
                id="department"
                name="department"
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-500 sm:text-sm"
                placeholder="e.g., Mathematics, Science"
              />
            </div>
            <div>
              <label htmlFor="designation" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Designation *
              </label>
              <input
                id="designation"
                name="designation"
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-500 sm:text-sm"
                placeholder="e.g., Senior Lecturer"
              />
            </div>
          </>
        )}

        {/* Parent-specific fields */}
        {role === "parent" && (
          <>
            <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                You can register with multiple children. Enter the Parent ID from each child's student record.
              </p>
            </div>
            <div>
              <label htmlFor="number-of-children" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Number of Children *
              </label>
              <select
                id="number-of-children"
                name="number-of-children"
                required
                value={numberOfChildren}
                onChange={(e) => {
                  const num = parseInt(e.target.value);
                  setNumberOfChildren(num);
                  // Adjust parentIds array to match the number
                  const newParentIds = Array(num).fill("").map((_, i) => parentIds[i] || "");
                  setParentIds(newParentIds);
                }}
                className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-zinc-900 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700 dark:focus:ring-zinc-500 sm:text-sm"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? "Child" : "Children"}
                  </option>
                ))}
              </select>
            </div>
            {parentIds.map((parentId, index) => (
              <div key={index}>
                <label htmlFor={`parent-id-${index}`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Parent ID for Child {index + 1} *
                </label>
                <input
                  id={`parent-id-${index}`}
                  name={`parent-id-${index}`}
                  type="text"
                  required
                  value={parentId}
                  onChange={(e) => {
                    const newParentIds = [...parentIds];
                    newParentIds[index] = e.target.value;
                    setParentIds(newParentIds);
                  }}
                  className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-500 sm:text-sm"
                  placeholder={`Enter Parent ID for child ${index + 1}`}
                />
                {index === 0 && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    This ID is automatically generated when your child's student account is created.
                  </p>
                )}
              </div>
            ))}
            <div>
              <label htmlFor="phone-number" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Phone Number *
              </label>
              <input
                id="phone-number"
                name="phone-number"
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-500 sm:text-sm"
                placeholder="+1234567890"
              />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Address *
              </label>
              <textarea
                id="address"
                name="address"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-500 sm:text-sm"
                placeholder="Enter your full address"
              />
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={loading}
          className="group relative flex w-full justify-center rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:outline-zinc-400"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </div>
    </form>
  );
}
