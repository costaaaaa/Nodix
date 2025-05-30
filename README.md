# Nodix - Organize Your Ideas, Visualize Your Knowledge

Nodix is a web application designed to help you organize your thoughts, notes, and ideas effectively. It provides a simple and intuitive interface for creating and managing text-based content within a structured folder system.

## Key Features

*   **User Authentication:** Secure registration and login system for personalized access.
*   **Folder Management:** Create and manage folders to categorize your notes.
*   **Text Note Creation:** Easily create, edit, and store rich text notes.
*   **Sandbox Mode:** A dedicated area to try out Nodix's functionalities without needing to register an account. This is accessible via `sandbox.php`.
*   **Dashboard:** A central place (`dashboard.php`) to view and manage all your folders and text notes after logging in.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   A web server (e.g., Apache, Nginx)
*   PHP (ensure the version is compatible with the project, check `config/database.php` for PDO usage, typically PHP 7.x or higher)
*   MySQL or MariaDB database server

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```
    (Replace `<repository_url>` with the actual URL of this repository and `<repository_directory>` with the name of the cloned directory).

2.  **Set up the database:**
    *   Create a new database in your MySQL/MariaDB server. You can name it `nodix` or choose another name.
    *   Import the `database.sql` file into your newly created database. This will create the necessary tables (`NODIX_users`, `NODIX_folders`, `NODIX_texts`).
        ```bash
        mysql -u your_username -p your_database_name < database.sql
        ```
        (Replace `your_username` and `your_database_name` accordingly).

3.  **Configure database connection:**
    *   Open the `config/database.php` file.
    *   Update the database connection details:
        ```php
        <?php
        $host = 'localhost'; // Or your database host
        $dbname = 'nodix';   // Your database name
        $username = 'root';  // Your database username
        $password = '';      // Your database password
        // ... rest of the file
        ?>
        ```
    *   Ensure the credentials and database name match your setup.

4.  **Run the application:**
    *   Place the project files in your web server's document root (e.g., `htdocs` for Apache, `www` for Nginx).
    *   Open your web browser and navigate to the project's `index.php` (e.g., `http://localhost/nodix/` or `http://localhost/your_project_directory_name/`).

## Project Structure

Here's a brief overview of the main files and directories:

*   **`index.php`**: The main landing page of the application.
*   **`login.php`**: Handles user login.
*   **`register.php`**: Handles user registration.
*   **`dashboard.php`**: The user's main dashboard after logging in, displaying folders and text notes.
*   **`editor.php`**: Allows users to create and edit their text notes.
*   **`sandbox.php`**: A page for users to try Nodix features without an account.
*   **`logout.php`**: Handles user logout.
*   **`config/`**: Contains configuration files.
    *   **`database.php`**: Handles the database connection (PDO).
*   **`css/`**: Contains stylesheets.
    *   **`style.css`**: Main custom stylesheet for the application.
*   **`js/`**: Contains JavaScript files.
    *   **`map-generator.js`**: (Purpose might need to be inferred or described if used in sandbox/editor)
    *   **`text-editor.js`**: (Purpose might need to be inferred or described if used in editor)
*   **`database.sql`**: The SQL script to set up the database schema.
*   **`.DS_Store`**: macOS specific file, can be added to `.gitignore`.

## Contributing

Contributions are welcome! If you have suggestions for improvements or want to fix a bug, please feel free to:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/YourFeature` or `git checkout -b bugfix/YourBugfix`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/YourFeature`).
6.  Open a Pull Request.

Please ensure your code follows the existing style and that any new features are well-documented.
