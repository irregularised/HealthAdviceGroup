<?php
session_start();
$conn = new mysqli("localhost", "root", "", "health_advice_group");

// Check for connection errors
if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Ensure that the form fields are properly sanitized
    $email = $_POST['email']; // Ensure the form uses 'email' as the input name
    $password = $_POST['password'];

    // Prepare and execute the SQL query to retrieve user data by email
    $stmt = $conn->prepare("SELECT id, password FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();

    // Check if any user is found with the provided email
    if ($stmt->num_rows > 0) {
        $stmt->bind_result($id, $hashed_password);
        $stmt->fetch();

        // Verify the password
        if (password_verify($password, $hashed_password)) {
            // Successful login: store user details in session
            $_SESSION["user_id"] = $id;
            $_SESSION["email"] = $email;

            // Redirect to dashboard
            header("Location: dashboard.php");
            exit();
        } else {
            echo "<script>alert('Incorrect password.'); window.location.href='login.html';</script>";
        }
    } else {
        // If no user is found
        echo "<script>alert('User not found.'); window.location.href='login.html';</script>";
    }

    // Close the statement
    $stmt->close();
}

// Close the database connection
$conn->close();
?>
