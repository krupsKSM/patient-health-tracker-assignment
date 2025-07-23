# Patient Health Tracker

A robust backend REST API for patient health tracking with user authentication, patient CRUD operations, secure file uploads, background job processing with Redis and Bull, and an admin dashboard for real-time metrics.


---

## 1. How to run the project

### Prerequisites

- Node.js v14 or higher installed
- Access to a MongoDB database (local or cloud)
- Access to a Redis instance (e.g. Upstash)
- npm (comes with Node.js)

### Setup Steps

```
git clone https://github.com//patient-health-tracker-assignment.git
cd patient-health-tracker-assignment
npm install
```

Create a `.env` file in the project root following the guidelines below, then start the server:

```
npm run dev
```

By default, the API will run on:  
`http://localhost:3000`

---

## 2. Environment variables required
Create a `.env` file with the following variables (replace placeholder values):

```
PORT=3000
MONGO_URI=your_mongodb_connection_string
REDIS_URL=your_redis_connection_url
JWT_SECRET=your_jwt_secret_key
```

---

## 3. Basic Endpoint Responses

| URL                       | Expected Response                         |
|---------------------------|-------------------------------------------|
| `/` (root)                | `{ "message": "Route not found" }`        |
| `/api/test`               | `{ "message": "API is working fine!" }`   |
| `/api/*` (valid endpoints) | Corresponding JSON data/responses         |

> **Note:** The root URL does not serve a frontend and will return a 404 JSON message. Use the documented API endpoints for interaction.

---

## 4 . Sample API Requests (Postman)

You can test the API endpoints using Postman or any HTTP client.

### 4.1 User Registration

- **POST** `/api/auth/register`  
- **Headers:**  
  `Content-Type: application/json`  
- **Body:**

```
{
  "name": "Ravi Kumar",
  "email": "ravi.kumar@example.com",
  "password": "RaviPass123",
  "role": "admin"
}
```

### 4.2 User Login

- **POST** `/api/auth/login`  
- **Headers:**  
  `Content-Type: application/json`  
- **Body:**

```
{
  "email": "ravi.kumar@example.com",
  "password": "RaviPass123"
}
```

### 4.3 Create Patient (Authenticated)

- **POST** `/api/patients`  
- **Headers:**  
  `Authorization: Bearer `  
- **Body:** Use **form-data** for file uploads:

| Key           | Value                  | Type  |
|---------------|------------------------|-------|
| name          | Anjali Mehta           | Text  |
| age           | 38                     | Text  |
| height        | 165                    | Text  |
| weight        | 64                     | Text  |
| fatPercentage | 22                     | Text  |
| profileImage  | (Select image file)    | File  |
| reportPDF     | (Optional PDF file)    | File  |

### 4.4 Get Patients List

- **GET** `/api/patients?page=1&limit=10`  
- **Headers:**  
  `Authorization: Bearer `

### 4.5 Get Patient Details

- **GET** `/api/patients/`  
- **Headers:**  
  `Authorization: Bearer `

### 4.6 Update Patient

- **PUT** `/api/patients/`  
- **Headers:**  
  `Authorization: Bearer `  
- **Body:** Form-data (fields/files to update)

### 4.7 Delete Patient (Admin only)

- **DELETE** `/api/patients/`  
- **Headers:**  
  `Authorization: Bearer `

### 4.8 Admin Dashboard Stats

- **GET** `/api/dashboard/admin`  
- **Headers:**  
  `Authorization: Bearer `

---

## 5. Live Demo

The app is currently deployed on Render.com and accessible at:  

```
https://patient-health-tracker-assignment.onrender.com
```

Use this base URL to access all API endpoints.

---


### Thank you for reviewing my project!  
I look forward to the opportunity to contribute my skills and grow in your team.
