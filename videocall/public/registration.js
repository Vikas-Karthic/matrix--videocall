document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const rollnum = document.getElementById("rollnum").value;

    try {
        const response = await fetch("/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email, password, rollnum })
        });

        if (response.ok) {
            alert("Registration successful!");
            window.location.href = "/login";
        } else {
            alert("Registration failed. Please try again.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
});