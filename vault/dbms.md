# DATABASE MANAGEMENT SYSTEM (DBMS)

#bitscourseware #selflearning #database #DBMS #GATE

---

## 1. Basic Introduction

- Two-Tier Architecture  
- Three-Tier Architecture  
- Three-Schema Architecture  
  - External Level  
  - Conceptual Level  
  - Internal Level  
- Data Independence  
  - Logical Data Independence  
  - Physical Data Independence  

---

## 2. Data Models

- Network Data Model  
- Hierarchical Data Model  
- Relational Data Model  
- Entity-Relationship (ER) Model  
- Object-Oriented Data Model  

---

## 3. Entity-Relationship (E-R) Model

- Entity Types  
- Attributes  
  - Simple and Composite  
  - Single-valued and Multi-valued  
  - Derived Attributes  
- Relationships  
- Types of Relationships (1:1, 1:N, M:N)  
- Weak Entities  
- Participation Constraints  
- Cardinality Constraints  

---

## 4. Keys in DBMS

- Super Key  
- Candidate Key  
- Primary Key  
- Alternate Key  
- Foreign Key  

---

## 5. Functional Dependencies & Normalization

### Functional Dependencies (FD)
- Trivial and Non-trivial FD  
- Attribute Closure  
- Canonical Cover (Minimal Cover)  
- Armstrong’s Axioms  

### Decomposition Properties
- Lossless Join Decomposition  
- Dependency Preservation  

### Normal Forms
- First Normal Form (1NF)  
- Second Normal Form (2NF)  
- Third Normal Form (3NF)  
- Boyce-Codd Normal Form (BCNF)  
- Multivalued Dependencies (MVD)  
- Fourth Normal Form (4NF)  
- Join Dependencies  
- Fifth Normal Form (5NF)  

---

## 6. Transaction Control & Concurrency

### ACID Properties
- Atomicity  
- Consistency  
- Isolation  
- Durability  

### Concurrency Problems
- Read-Write (R-W) Conflict  
- Write-Read (W-R) Conflict  
- Write-Write (W-W) Conflict  
- Dirty Read  
- Lost Update  
- Non-Repeatable Read  

### Schedules & Control
- Serial and Concurrent Schedules  
- Conflict Serializability  
- View Serializability  
- Recoverability  
- Cascading Rollback  

### Concurrency Control Techniques
- Two-Phase Locking (2PL)  
  - Strict 2PL  
- Timestamp Ordering  
- Deadlock Handling  

---

## 7. SQL & Relational Algebra

### SQL

- Data Definition Language (DDL)  
- Data Manipulation Language (DML)  
- Data Control Language (DCL)  
- Constraints  
  - NOT NULL  
  - UNIQUE  
  - PRIMARY KEY  
  - FOREIGN KEY  
  - CHECK  
- Aggregate Functions  
- Joins  
- Nested Queries  
- Views  
- Triggers  

### Relational Algebra

- Selection (σ)  
- Projection (π)  
- Union  
- Intersection  
- Set Difference  
- Cartesian Product  
- Join  
- Division  

---

## 8. Indexing & File Organization

- Primary Index  
- Clustering Index  
- Secondary Index  
- Dense Index  
- Sparse Index  
- Hash Indexing  
- B-Tree  
- B+ Tree 

---

# What is DBMS

Database is a collection of relation data.
![[Pasted image 20260224231336.png]]



# DBMS Advantages

## Why DBMS?

Before DBMS, traditional File Systems were used to store data.

In file-based systems:
- Data was stored in separate files.
- Each application maintained its own data.
- There was no centralized control.
- Data redundancy and inconsistency were common.
- Data sharing was difficult.
- Concurrency handling was weak or manual.
- Security mechanisms were limited.

Because of these limitations, Database Management Systems (DBMS) were introduced.

---

## What Problems Did DBMS Solve?

- Reduced Data Redundancy  
- Reduced Data Inconsistency  
- Improved Data Sharing  
- Centralized Data Management  
- Better Data Integrity  
- Efficient Data Access  
- Concurrency Control  
- Enhanced Security  
- Backup and Recovery Support  

---

## Why We Use DBMS?

DBMS follows a Client-Server Architecture.

- Data is stored in a centralized database server.
- Clients (applications/users) request data from the server.
- The DBMS manages storage, retrieval, security, and concurrency.

The data can be stored on:
- Local storage (HDD, SSD)
- Cloud servers
- Distributed systems

---

## Key Advantages of DBMS

### 1. Concurrency Control
Multiple users can access data simultaneously without corrupting it.

### 2. Security
Authentication, authorization, and access control mechanisms protect data.

### 3. Data Integrity
Constraints ensure accuracy and consistency of data.

### 4. Backup and Recovery
System can recover from crashes and failures.

### 5. Data Independence
Changes in storage structure do not affect application programs.

### 6. Reduced Redundancy
Single source of truth reduces duplicate data.

----

## t## Two-Tier and Three-Tier Architecture | Database Management System

---

## 1. Two-Tier Architecture (2-Tier System)

A Two-Tier Architecture consists of:

1. Client Layer (User Machine)
2. Database Server

In this model:
- The client directly communicates with the database server.
- Business logic may exist in the client application.
- SQL queries are sent directly to the database.

### Structure

Client Application  <------>  Database Server

### Real-Life Example

- A desktop application like a local banking software installed in a branch office.
- The software directly connects to a central MySQL or Oracle database server.

### Characteristics

- Simple design
- Suitable for small-scale systems
- Faster communication (direct connection)
- Less secure and less scalable compared to 3-tier

---

## 2. Three-Tier Architecture (3-Tier System)

A Three-Tier Architecture consists of:

1. Presentation Layer (Client / UI)
2. Application Layer (Business Logic Server)
3. Database Layer (Database Server)

In this model:
- The client does NOT directly communicate with the database.
- The application server processes business logic.
- The database server stores and manages data.

### Structure

Client (Frontend)  
        ↓  
Application Server (Backend)  
        ↓  
Database Server  

### Real-Life Example

- Modern web applications:
  - Browser (Frontend)
  - Node.js / Django / Spring Boot (Backend Server)
  - MySQL / PostgreSQL (Database)

Example:
- Instagram
- Amazon
- Banking apps

### Characteristics

- Better security (database is not directly exposed)
- Better scalability
- Easier maintenance
- Suitable for large-scale systems

---

# What is Schema? | How to Define Schema

---

## What is Schema?

A Schema is the logical structure or blueprint of a database.

It defines:
- Tables
- Attributes (columns)
- Data types
- Relationships
- Constraints

Schema describes **how data is organized**, not the actual data itself.

---

## In RDBMS

In a Relational Database Management System (RDBMS):

- Data is represented in the form of tables (relations).
- Each table consists of rows (tuples) and columns (attributes).

---

## Example in ER Model

### Entity: Student

Attributes:
- name
- age
- roll_no
- address

### Entity: Course

Attributes:
- course_id
- course_name
- duration

These entities and their attributes form the **conceptual schema**.

---

## Implementing Schema in SQL

Schema is implemented using **DDL (Data Definition Language)** commands.

DDL is used to:
- CREATE tables
- ALTER tables
- DROP tables

### Example SQL Implementation

```sql
CREATE TABLE Student (
    roll_no INT PRIMARY KEY,
    name VARCHAR(100),
    age INT,
    address VARCHAR(200)
);

CREATE TABLE Course (
    course_id INT PRIMARY KEY,
    course_name VARCHAR(100),
    duration INT
);
```

---
# Three-Schema Architecture | Three Levels of Abstraction

---

## What is Schema?

Schema = Structure of the database.

It defines:
- Tables
- Attributes
- Relationships
- Constraints

Schema describes how data is organized.

---

## Three-Schema Architecture

The Three-Schema Architecture is used to separate user view, logical structure, and physical storage of the database.

It consists of three levels:

---

## 1. External Schema (View Level)

- Also called View Level.
- Represents how different users see the database.
- Each user can have a different external schema.

Example:
- Student view
- Faculty view
- Dean view

Each view shows only relevant data.

Purpose:
- Security
- Customization
- Data hiding

---

## 2. Conceptual Schema (Logical Level)

- Describes the complete logical structure of the database.
- Defines entities, attributes, relationships, and constraints.
- Independent of physical storage.

Models used:
- ER Model
- Relational Model

Example:
Tables like:
- Student(roll_no, name, age, address)
- Course(course_id, course_name, duration)

This level describes WHAT data is stored.

---

## 3. Internal Schema (Physical Level)

- Also called Physical Schema.
- Describes how data is stored on disk.
- Defines:
  - File organization
  - Indexing
  - Storage structures
  - Access paths

This level describes HOW data is stored.

---

## Flow of Architecture

Users  
↓  
External Schema (View Level)  
↓  
Conceptual Schema (Logical Level)  
↓  
Internal Schema (Physical Level)  
↓  
Database (Disk Storage)

---

## Key Concept: Data Independence

1. Logical Data Independence  
   Changes in conceptual schema do not affect external schema.

2. Physical Data Independence  
   Changes in internal schema do not affect conceptual schema.

----
----
#  What is Data Independence | Logical vs. Physical Independence

# Data Independence in DBMS

Data Independence refers to the ability to modify the schema at one level of the database architecture without affecting the next higher level.

It provides transparency to users and application programs.

---

## 1. Logical Data Independence

Logical Data Independence is the ability to modify the conceptual schema without affecting the external schema (view level).

The conceptual schema defines the logical structure of the database, such as:
- Adding or removing columns
- Adding new tables
- Modifying relationships

These changes should not require rewriting application programs.

This is achieved using views:
- Views are virtual tables.
- They display only selected columns or data.
- Even if the base table structure changes, the view can remain consistent for the user.

Benefit:
Application programs continue to work even when the logical structure of the database changes.

---

## 2. Physical Data Independence

Physical Data Independence is the ability to modify the internal (physical) schema without affecting the conceptual schema.

The physical schema defines how data is stored:
- File organization
- Indexing methods
- Storage structures
- Disk changes (HDD to SSD, cloud migration, etc.)

Users and application programs do not perceive these backend changes.

Example:
A company may change indexing strategy or migrate to a different storage system, but the database structure (tables, attributes) remains the same from the user's perspective.

Benefit:
System performance can be improved without modifying application logic.

---

## Why Data Independence is Important

- Provides transparency to users
- Reduces application maintenance
- Improves system flexibility
- Prevents frequent rewriting of application programs
- Enhances long-term scalability

---
---
# Integrity Constraints in Database

Integrity Constraints are rules defined in a database to ensure the accuracy, consistency, and reliability of data.

They enforce predefined conditions that data must satisfy before it is stored in the database.

---

## Types of Integrity Constraints

### 1. Domain Constraints

Domain constraints define the valid set of values that an attribute can take.

They enforce:
- Data type (INT, VARCHAR, DATE, etc.)
- Size limitations
- Range restrictions
- Format conditions

Example:
- Age must be an integer.
- Age must be between 0 and 120.
- Email must follow a valid format.

These constraints ensure that attribute values belong to a valid domain.

---

### 2. Entity Integrity Constraint

Entity integrity ensures that:

- Every table must have a Primary Key.
- The Primary Key must be unique.
- The Primary Key cannot be NULL.

This ensures that each row (tuple) in a table is uniquely identifiable.

Example:
Student(roll_no, name, age)

Here, roll_no as PRIMARY KEY guarantees no duplicate or NULL values.

---

### 3. Referential Integrity Constraint

Referential integrity ensures consistency between related tables.

- A Foreign Key in one table must match an existing Primary Key in the referenced table.
- Or it must be NULL (if allowed).

Example:

Student(roll_no, name)  
Enrollment(roll_no, course_id)

If roll_no in Enrollment is a foreign key,
it must exist in the Student table.

This prevents orphan records.

---

### 4. Key Constraints

Key constraints ensure uniqueness of certain attributes.

- Candidate Key: Minimal attribute set that uniquely identifies a tuple.
- Primary Key: Selected candidate key.
- UNIQUE constraint: Enforces uniqueness but may allow NULL (depending on DBMS).

Example:
Email in a User table may have a UNIQUE constraint.

---

## Why Integrity Constraints Are Important

- Prevent invalid data entry
- Maintain consistency across tables
- Avoid duplication
- Protect relational structure
- Ensure reliable query results

---
---
# What is Candidate Key and Primary Key?

---

## What is a Key?

A Key is an attribute or a set of attributes that uniquely identifies a tuple (row) in a relation (table).

A key is not just a normal attribute.
It must uniquely identify each row in a table.

---

## Example: Student Table

Student(roll_no, email, name, age)

Assume:
- roll_no is unique
- email is unique

Both can uniquely identify a student.

---

## Candidate Key

A Candidate Key is a minimal set of attributes that uniquely identifies a tuple in a table.

Important properties:
- Must be unique
- Must be minimal (no unnecessary attribute included)

In the example:

- roll_no → Candidate Key
- email → Candidate Key

If we combine (roll_no, email), it is still unique,
but it is NOT minimal.
So it is not a candidate key.

---

## Primary Key

A Primary Key is one candidate key chosen by the database designer to uniquely identify tuples.

Rules:
- Cannot be NULL
- Must be unique
- Only one primary key per table

In the example:

If we choose roll_no as the primary key:

PRIMARY KEY (roll_no)

Then email remains a candidate key (often enforced using UNIQUE).

---

## Simple Difference

Candidate Key = All possible minimal unique identifiers  
Primary Key = One selected candidate key

---

## Key Insight

All Primary Keys are Candidate Keys.  
But not all Candidate Keys are Primary Keys.

---
---

# What is Primary Key in DBMS

# What is Primary Key in DBMS?

A Primary Key is an attribute (or a set of attributes) that uniquely identifies each row (tuple) in a table.

It is selected from the candidate keys of the table.

---

## Properties of a Primary Key

1. Must be Unique  
   No two rows can have the same primary key value.

2. Cannot be NULL  
   Every row must have a valid primary key value.

3. Only One Primary Key per Table  
   A table can have multiple candidate keys, but only one is chosen as the primary key.

---

## Example

Student(roll_no, email, name, age)

If:
- roll_no is unique
- email is also unique

Both are candidate keys.

If we choose roll_no as the primary key:

PRIMARY KEY (roll_no)

Then:
- roll_no → Primary Key
- email → Candidate Key (may use UNIQUE constraint)

---

## Why Primary Key is Important

- Uniquely identifies records
- Prevents duplicate entries
- Enables relationships between tables (via Foreign Keys)
- Ensures entity integrity

----
---

# Foreign Key in DBMS

# Foreign Key in DBMS

## What is a Foreign Key?

A Foreign Key is an attribute or a set of attributes in one table that refers to the Primary Key of the same table or another table.

It is used to maintain Referential Integrity between tables.

---

## Purpose of Foreign Key

- Establish relationship between two tables
- Prevent invalid data entry
- Maintain consistency across related tables

---

## Example

### Student Table

Student(roll_no, name, address)

| roll_no | name | address |
|---------|------|---------|
| 1       | A    | Delhi   |
| 2       | B    | Mumbai  |
| 3       | C    | Chandigarh |

Here:
roll_no is the PRIMARY KEY.

---

### Course Table

Course(course_id, course_name, roll_no)

| course_id | course_name | roll_no |
|-----------|-------------|---------|
| C1        | DBMS        | 1       |
| C2        | Networks    | 2       |

Here:
roll_no is a FOREIGN KEY that references Student(roll_no).

---

## SQL Implementation

```sql
CREATE TABLE Student (
    roll_no INT PRIMARY KEY,
    name VARCHAR(50),
    address VARCHAR(100)
);

CREATE TABLE Course (
    course_id VARCHAR(10),
    course_name VARCHAR(50),
    roll_no INT,
    FOREIGN KEY (roll_no) REFERENCES Student(roll_no)
);

```

# Insert, Update & Delete from Foreign Key table



---
---


