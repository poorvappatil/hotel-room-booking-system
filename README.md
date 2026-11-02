# 🏨 Lumière Hotel Room Booking System

> A full-stack, enterprise-grade hotel room reservation system built with **Java 25**, **Spring Boot**, **Spring Data JPA**, **Hibernate**, **H2 Database**, and a responsive **HTML5/CSS3/JavaScript** frontend.

![Java](https://img.shields.io/badge/Java-25-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x%20%2F%204.x-brightgreen?logo=springboot)
![Spring Data JPA](https://img.shields.io/badge/Spring%20Data-JPA-blue?logo=spring)
![Database](https://img.shields.io/badge/Database-H2%20(File--Backed)-blue?logo=sqlite)
![Architecture](https://img.shields.io/badge/Architecture-3--Tier%20Layered-purple)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

---

## 📌 Table of Contents
- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Core Technical Highlights](#-core-technical-highlights)
  - [1. Mathematical Date-Overlap Query](#1-mathematical-date-overlap-query)
  - [2. Race Condition Prevention via Pessimistic Locking](#2-race-condition-prevention-via-pessimistic-locking)
  - [3. DTO Pattern & Separation of Concerns](#3-dto-pattern--separation-of-concerns)
- [Technology Stack](#-technology-stack)
- [REST API Specification](#-rest-api-specification)
- [Database Configuration & H2 Console](#-database-configuration--h2-console)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started & Installation](#-getting-started--installation)
- [Exception Handling & Status Codes](#-exception-handling--status-codes)

---

## 📖 Project Overview

Manual hotel reservation systems suffer from critical operational defects: double bookings, lost records, race conditions during peak demand, and human error. 

The **Lumière Hotel Room Booking System** provides an end-to-end, automated solution designed to:
1. Allow prospective guests to search and filter accommodations by room type, guest capacity, price, and operational status.
2. Calculate total stay costs dynamically in real time.
3. Guarantee that no two guests can ever reserve the same physical room for overlapping stay dates.
4. Provide instant digital receipt/folio generation and soft reservation cancellation.
5. Offer hotel staff a dedicated management portal for room inventory CRUD operations.

---

## ✨ Key Features

- **Dynamic Room Catalog & Multi-Filter Search**: Filter rooms by style (Deluxe, Standard, Suite, Family), maximum guest capacity, price ceiling in Indian Rupees (₹), and active availability.
- **Interactive Stay Calculator**: Calculates number of nights and total price dynamically as check-in and check-out dates are selected.
- **Real-Time Overlap Detection**: Rejects any booking request that conflicts with existing confirmed stay intervals.
- **Pessimistic Concurrency Control**: Eliminates database-level race conditions when multiple users attempt to reserve the same room simultaneously.
- **Soft Cancellation**: Allows guests to cancel a reservation by reference ID. The record transitions to `CANCELLED`, preserving historical audit data while releasing the dates for new guests.
- **Staff Administration Portal**: Full CRUD interface to add new rooms, modify prices and capacities, toggle room maintenance states, or remove rooms.
- **Responsive Presentation Layer**: Modern typography, custom property-based theme tokens, animated modals, and toast notification alerts.

---

## 🏗️ System Architecture

The project strictly follows the **3-Tier Layered Architecture** adhering to the *Separation of Concerns* principle:

```
[ Web Browser / Client ]
       │
       │ HTTP REST API (JSON payloads via fetch())
       ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Controller Layer (@RestController)                       │
│    • RoomController.java                                    │
│    • BookingController.java                                 │
│    • GlobalExceptionHandler.java (@RestControllerAdvice)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Calls Service Methods
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Service Layer (@Service)                                 │
│    • RoomService.java (Input checks & inventory logic)       │
│    • BookingService.java (Transactions & date validations)  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Queries Entities via JPA
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Repository / Persistence Layer (@Repository)             │
│    • RoomRepository.java (Pessimistic row locking)          │
│    • BookingRepository.java (JPQL overlap queries)          │
└──────────────────────────────┬──────────────────────────────┘
                               │ JDBC SQL Execution
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Relational Database Engine                               │
│    • H2 Embedded File Storage (./data/hotelbooking.mv.db)   │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Core Technical Highlights

### 1. Mathematical Date-Overlap Query
To guarantee rooms are never double-booked, `BookingRepository.java` uses a specialized JPQL query:

```sql
SELECT COUNT(b) > 0
FROM Booking b
WHERE b.room.id = :roomId
  AND b.status = 'CONFIRMED'
  AND b.checkInDate < :checkOut
  AND b.checkOutDate > :checkIn
```

#### Why this logic is watertight:
For any existing booking $[E_{in}, E_{out}]$ and a requested stay $[N_{in}, N_{out}]$, an overlap occurs if and only if:
$$\text{Existing Check-In} < \text{New Check-Out} \quad \land \quad \text{Existing Check-Out} > \text{New Check-In}$$

- **Same-Day Turnover**: If Guest A checks out on Oct 10 ($E_{out} = 10$) and Guest B checks in on Oct 10 ($N_{in} = 10$), the condition $E_{out} > N_{in}$ ($10 > 10$) evaluates to **FALSE**. No overlap is detected, allowing seamless back-to-back guest turnover!
- **Cancelled Bookings Ignored**: Because the query filters by `b.status = 'CONFIRMED'`, cancelled bookings immediately free up dates without requiring database row deletion.

---

### 2. Race Condition Prevention via Pessimistic Locking
When two guests click "Book Room" at the exact same millisecond:
1. `BookingService.createBooking` runs within a `@Transactional` boundary.
2. It executes:
   ```java
   @Lock(LockModeType.PESSIMISTIC_WRITE)
   @Query("SELECT r FROM Room r WHERE r.id = :id")
   Optional<Room> findByIdForUpdate(@Param("id") Long id);
   ```
3. Hibernate translates this to SQL with a `SELECT ... FOR UPDATE` clause.
4. The database places an exclusive write lock on that room's row.
5. The second transaction is suspended until the first transaction commits or rolls back.
6. When the second transaction resumes, it reads the freshly committed booking, detects the overlap, and safely fails with HTTP `409 Conflict`.

---

### 3. DTO Pattern & Separation of Concerns
Database entities (`Room`, `Booking`) are **never** exposed directly in API requests or responses.
- `CreateBookingRequest`: Controls incoming request contracts and prevents malicious manipulation of internal fields (e.g. setting an artificial ID or forcing a status).
- `BookingResponse`: Provides a clean, flat data contract that prevents Jackson JSON serialization circular reference issues.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Language** | Java 25 (OpenJDK) | Core backend programming language |
| **Framework** | Spring Boot | Auto-configuration, embedded Tomcat, IoC container |
| **Persistence** | Spring Data JPA / Hibernate | Object-Relational Mapping (ORM) and dynamic repository queries |
| **Database** | H2 Database Engine | Embedded, file-persistent SQL database (`./data/hotelbooking`) |
| **Validation** | Jakarta Bean Validation | Input boundary constraints and validation rules |
| **Build Tool** | Apache Maven (`mvnw`) | Dependency resolution, compilation, and packaging |
| **Frontend** | HTML5, Modern CSS3, Vanilla JS | Lightweight client UI with zero external build step requirements |

---

## 📡 REST API Specification

### Room Endpoints (`/api/rooms`)

| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/rooms` | Retrieve all room records | `200 OK` |
| `GET` | `/api/rooms/{id}` | Retrieve room by ID | `200 OK` / `404 Not Found` |
| `POST` | `/api/rooms` | Create a new room | `200 OK` / `400 Bad Request` |
| `PUT` | `/api/rooms/{id}` | Update room details | `200 OK` / `404 Not Found` |
| `DELETE` | `/api/rooms/{id}` | Delete room by ID | `204 No Content` / `404 Not Found` |

#### Sample Room Creation Payload:
```json
{
  "roomNumber": "205",
  "type": "Executive Suite",
  "pricePerNight": 4500.00,
  "capacity": 3,
  "active": true
}
```

---

### Booking Endpoints (`/api/bookings`)

| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/bookings` | Retrieve all reservations | `200 OK` |
| `GET` | `/api/bookings/{id}` | Retrieve reservation folio by ID | `200 OK` / `404 Not Found` |
| `POST` | `/api/bookings` | Create and confirm a new booking | `201 Created` / `400` / `409 Conflict` |
| `PATCH` | `/api/bookings/{id}/cancel` | Cancel an existing reservation | `200 OK` / `404` / `409 Conflict` |
| `DELETE` | `/api/bookings/{id}` | Permanently delete booking record | `200 OK` / `404 Not Found` |

#### Sample Booking Creation Payload:
```json
{
  "roomId": 1,
  "guestName": "Jane Doe",
  "checkInDate": "2026-11-10",
  "checkOutDate": "2026-11-14"
}
```

---

## 🗄️ Database Configuration & H2 Console

The database is configured in [`src/main/resources/application.properties`](file:///home/smit_k/.gemini/antigravity/scratch/hotel-room-booking-system/src/main/resources/application.properties):

```properties
spring.datasource.url=jdbc:h2:file:./data/hotelbooking
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=hotelBooking
spring.datasource.password=
spring.jpa.hibernate.ddl-auto=update
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
```

### Accessing the Web Console:
1. Open [http://localhost:8080/h2-console](http://localhost:8080/h2-console) in your browser.
2. Set **JDBC URL** to: `jdbc:h2:file:./data/hotelbooking`
3. Set **User Name** to: `hotelBooking`
4. Leave **Password** blank and click **Connect**.

---

## 📂 Project Directory Structure

```
hotel-room-booking-system/
├── data/                                 # File-backed H2 persistent database files
│   ├── hotelbooking.mv.db
│   └── hotelbooking.trace.db
├── src/
│   ├── main/
│   │   ├── java/com/hotel/booking/
│   │   │   ├── controller/               # REST Controllers (RoomController, BookingController)
│   │   │   ├── dto/                      # Data Transfer Objects (Requests & Responses)
│   │   │   ├── entity/                   # JPA Entity Models (Room, Booking)
│   │   │   ├── exception/                # Custom Exceptions & GlobalExceptionHandler
│   │   │   ├── repository/               # Spring Data JPA Repository Interfaces
│   │   │   ├── service/                  # Business Logic Layer (RoomService, BookingService)
│   │   │   └── HotelRoomBookingSystemApplication.java # Spring Boot Entry Point
│   │   └── resources/
│   │       ├── application.properties    # Application configuration
│   │       └── static/                   # Static Frontend Assets
│   │           ├── index.html            # Landing / Home Page
│   │           ├── rooms.html            # Suite Catalog with Multi-Filters
│   │           ├── room-details.html     # Suite Details & Dynamic Stay Calculator
│   │           ├── booking.html          # Reservation Form
│   │           ├── confirmation.html     # Folio Receipt & Cancellation
│   │           ├── manage-rooms.html     # Staff Inventory CRUD Portal
│   │           ├── css/                  # Styling & Responsiveness
│   │           └── js/                   # Asynchronous Fetch Client & Page Controllers
│   └── test/                             # Automated JUnit 5 Integration Tests
├── pom.xml                               # Maven Build Descriptor
└── README.md                             # Project Documentation
```

---

## 🚀 Getting Started & Installation

### Prerequisites
- **JDK 25** (or compatible modern OpenJDK) installed and on your `PATH`.
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/poorvappatil/hotel-room-booking-system.git
cd hotel-room-booking-system
```

### 2. Build the Project
```bash
./mvnw clean compile
```

### 3. Run the Application
```bash
./mvnw spring-boot:run
```

Once started, access the application in your browser:
- **Guest Portal**: [http://localhost:8080](http://localhost:8080)
- **Staff Room Management**: [http://localhost:8080/manage-rooms.html](http://localhost:8080/manage-rooms.html)
- **H2 Database Console**: [http://localhost:8080/h2-console](http://localhost:8080/h2-console)

---

## 🛡️ Exception Handling & Status Codes

The application employs `@RestControllerAdvice` in `GlobalExceptionHandler.java` to map custom domain exceptions to standard HTTP response codes:

| Exception Class | Trigger Condition | HTTP Status Code |
| :--- | :--- | :--- |
| `IllegalArgumentException` | Negative room price, 0 capacity, past check-in date | `400 Bad Request` |
| `RoomNotFoundException` | Room ID does not exist in database | `404 Not Found` |
| `BookingNotFoundException` | Booking reference ID does not exist | `404 Not Found` |
| `BookingConflictException` | Overlapping dates detected, or booking is already cancelled | `409 Conflict` |

---

## 📜 License
This project is open-source and available under the **MIT License**.
