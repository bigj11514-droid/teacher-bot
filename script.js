const API_BASE_URL = "http://127.0.0.1:5000/api";

function getFormValue(form, names) {
  for (const name of names) {
    const field = form.elements.namedItem(name) || document.getElementById(name);
    if (field) return field.value.trim();
  }
  return "";
}

async function readApiResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Something went wrong. Please try again.");
  }
  return data;
}

async function handleSignUp(event) {
  event.preventDefault();
  const form = event.currentTarget;

  const userData = {
    full_name: getFormValue(form, ["full_name", "student-name"]),
    email: getFormValue(form, ["email", "student-email"]),
    account_type: getFormValue(form, ["account_type", "account-role"]),
    department: getFormValue(form, ["department", "student-department"]),
    password: getFormValue(form, ["password", "student-password"]),
  };

  try {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    const data = await readApiResponse(response);
    alert(data.message);
    form.reset();
  } catch (error) {
    alert(error.message);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;

  const credentials = {
    email: getFormValue(form, ["email", "student-email"]),
    password: getFormValue(form, ["password", "student-password"]),
  };

  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const data = await readApiResponse(response);
    console.log("Logged-in user:", data.user);
    return data.user;
  } catch (error) {
    console.error("Login failed:", error.message);
    alert(error.message);
    return null;
  }
}
