# Software Requirements Specification for ShoutMe

**Prepared by:** Adeolu Adeogun & Justin Obasuyi  
**Date:** 13/11/2025  

---

# **Table of Contents**

- **Revision History**  
- **1. Introduction**  
  - 1.1 Purpose  
  - 1.2 Document Conventions  
  - 1.3 Intended Audience and Reading Suggestions  
  - 1.4 Product Scope  
  - 1.5 References  

- **2. Overall Description**  
  - 2.1 Product Perspective  
  - 2.2 Product Functions  
  - 2.3 User Classes and Characteristics  
  - 2.4 Operating Environment  
  - 2.5 Design and Implementation Constraints  
  - 2.6 User Documentation  
  - 2.7 Assumptions and Dependencies  

- **3. External Interface Requirements**  
  - 3.1 User Interfaces  
  - 3.2 Hardware Interfaces  
  - 3.3 Software Interfaces  
  - 3.4 Communications Interfaces  

- **4. System Features**  
  - 4.1 User Registration & Authentication  
  - 4.2 Event Browsing & Search  
  - 4.3 Event Creation & Management  
  - 4.4 Event Booking  
  - 4.5 Map-Based Event Discovery  
  - 4.6 User Profile Management  
  - 4.7 Social Features (Friends & Messaging)  
  - 4.8 Admin Management & Moderation  

- **5. Other Nonfunctional Requirements**  
  - 5.1 Performance Requirements  
  - 5.2 Safety Requirements  
  - 5.3 Security Requirements  
  - 5.4 Software Quality Attributes  
  - 5.5 Business Rules  

- **6. Other Requirements**

- **Appendix A: Glossary**

- **Appendix B: Analysis Models**

- **Appendix C: To Be Determined List**

---

## 1. Introduction

### 1.1 Purpose
This document describes the requirements of ShoutMe and its analysis. It serves as a reference to system design. Its intended audience is the project coordinator, project supervisor and system designers.

### 1.2 Document Conventions
This SRS follows a consistent set of standards and typographical conventions to ensure clarity and uniformity throughout the document.

#### Formatting Conventions
- **Bold text** is used to highlight key terms, requirement labels, and important system behaviours.  
- *Italic text* is used for optional notes, clarifications, or secondary emphasis.  
- `Monospace text` is used for technical keywords, API names, file paths, or code-related elements.

#### Priority Levels
Each requirement is assigned an explicit priority level (**High**, **Medium**, or **Low**).  
Priorities are **not inherited** from parent features—every individual requirement specifies its own priority.

#### Abbreviations
To improve readability, recurring terms are shortened using labels such as:
- **IA** – Intended Audience  
- **PR** – Performance Requirement  
- **SRE** – Safety Requirement  
- **SEC** – Security Requirement  
- **SQA** – Software Quality Attribute  
- **BR** – Business Rule  
- **REQ** – Functional Requirement  

 

### 1.3 Intended Audience and Reading Suggestions
- **IA-1: Project Coordinator** – Focus on Sections 1 and 2.
- **IA-2: Project Supervisor** – Focus on Sections 1, 2, 4, and 5.
- **IA-3: System Designers** – Focus on Sections 3 and 4.

### 1.4 Product Scope
ShoutMe is a **web-based event booking and social networking platform** that helps people connect through shared interests and real-world activities. It enables users to create, discover, and join events (from small casual meetups to larger community activities) while providing social features such as chatting, friend connections, and personalized recommendations.

The platform aims to go beyond simple event discovery by introducing a social interaction layer, enabling users to chat, connect, and build friendships with others who participate in similar events or share common interests. This transforms events from isolated experiences into opportunities for forming lasting social connections and fostering a sense of community and belonging. 

Unlike commercial platforms (Ticketmaster, Eventbrite), ShoutMe targets **community-driven, small-to-medium scale events**, giving anyone the freedom to host without restrictions. It bridges digital interaction and real-world connection, fostering lasting friendships and community belonging.

By combining event management tools with integrated social networking features, the platform bridges the gap between digital interaction and real-world connection. It encourages people to explore nearby activities, meet others with similar passions, and stay engaged within their local communities. Overall, the platform aligns with modern business strategies centred on community engagement, personalized user recommendations, and scalable digital ecosystems. It represents a sustainable model for long-term user retention, growth, and community-focused value generation. 

### 1.5 References
| REF | Document | Author/Source | Version/Date |
|-----|----------|----------------|--------------|
| REF-1 | IEEE SRS Standard (IEEE 830-1998) | IEEE Computer Society | 1998 |
| REF-2 | React Official Documentation | Meta Platforms, Inc. | React 18 (2025) |
| REF-3 | Django Framework Documentation | Django Software Foundation | Django 4.x (2025) |
| REF-4 | Google Maps JavaScript API | Google LLC | 2025 |
| REF-5 | PostgreSQL Documentation | PostgreSQL Global Development Group | 15.x (2025) |
| REF-6 | Project Vision & Scope Notes | Project Team (Justin & Adeolu) | 2025 |
| REF-7 | IEEE SRS Template | Academic Module Material | 2025 |

---

### 2.1 Overall Description 

### **2.1 Product Perspective**

ShoutMe is a **new, standalone web-based platform** designed to combine event booking with integrated social networking features.  
It is **not** a modification or extension of any existing system; instead, it is a **self-contained solution** built specifically to address the limitations of current large-scale event platforms and the lack of community-focused digital tools.




### 2.2 Product Functions

High level functions:
- User registration and login
- Create/manage event
- Join/leave/book events
- Maps based event browsing
- User profile and interests
- Friend system
- Chat and messaging
- Browse events by categories
- Recommended engine based on interests + location

![Functions Diagram](docs/images/Untitled_Diagram.webp)

### 2.3 User Classes and Characteristics
| User Class   | Description                  | Privileges                         |
|-------------|------------------------------|------------------------------------|
| General User| Regular event participants   | View/join events, create events    |
| Event Host  | Users that host or organise events | Full CRUD on their events     |
| Admin       | System managers              | Remove content, manage users       |

### 2.4 Operating Environment

It is going to be browser based running on either chrome, edge or safari, for the front end its going
to be React 1 8 and for the backend it is going to be Django 14 , database is going to be SQL and
we will be hosting it from our personal laptops with GitLab dep loyment

### 2.5 Design and Implementation Constraints

#### **Technology Constraints**

**Front-End Framework Requirement**  
The client interface must be implemented using **React**.  
No alternative front-end frameworks (Angular, Vue, Svelte, etc.) may be substituted.

**Back-End Framework Requirement**  
All server logic, authentication, and API endpoints must be built using **Django (Python)** as specified in the project requirements.

**Database Requirement**  
The system must use a **SQL-based relational database** (PostgreSQL or MySQL).  
No NoSQL technologies (e.g., MongoDB, Firebase Realtime DB) are permitted.

**Mapping & Geolocation**  
The platform must integrate the **Google Maps JavaScript API** for:
- Displaying event locations  
- Supporting map-based search and filtering  



#### **Hardware & Environment Constraints**

- The application must run on standard web browsers and consumer hardware (laptops, tablets, phones).  
- Development must use school-provided machines, which may limit:  
  - Local hosting  
  - Containerization  
  - Advanced deployment tools  
- The platform must **not** depend on specialised hardware, sensors, or high-performance GPUs.



#### **Architectural Constraints**

- The system must follow a **client–server REST architecture**.  
- All communication between React (front-end) and Django (back-end) must use **JSON** over **HTTPS**.  
- Real-time features (e.g., messaging) must follow approved methods only:  
  - **WebSockets**, or  
  - **HTTP Polling**, depending on feasibility within the project constraints.


### **2.6 User Documentation**

The following user documentation will be delivered alongside the platform to support end users, administrators, and developers. These documents assist with system setup, usage, troubleshooting, and ongoing maintenance.

---

#### **End-User Documentation**

**User Guide / Help Pages**  
A clear, beginner-friendly guide explaining:
- How to create an account  
- Join and create events  
- Navigate the map  
- Update profiles  
- Use chat features  
- Manage bookings  

**FAQ Section**  
Provides answers to common issues such as:
- “Why can’t I join this event?”  
- “How do I change my password?”  
- “Why is my location not loading?”  

**Onboarding Tips**  
Short instructional tooltips that appear when new users interact with key features for the first time.

#### **Administrator Documentation**

**Admin Usage Manual**  
Covers:
- User management  
- Event moderation  
- Identifying & removing inappropriate content  
- Monitoring system activity  

**System Maintenance Instructions**  
Includes:
- Regular backups  
- Clearing logs  
- Updating dependencies  
- Restarting services  
- Database management tasks  



#### **Developer Documentation**

**README File**  
Provided in the repository and includes:
- Installation steps  
- Project structure  
- API usage  
- Environment variables  
- Development standards  

**API Reference**  
Detailed documentation for each REST endpoint:
- Request/response formats  
- Authentication requirements  
- Error messages  

**UI Component Notes**  
Guide outlining React components, reusable modules, and standards for updating the interface.


#### **Delivery Format**

Documentation will be provided in the following formats:
- **PDF files** for formal guides  
- **Markdown files** stored inside the GitHub repository  
- **Inline comments** within source code  

Additional UI-specific design assets (wireframes, component layouts) may be delivered separately as part of a dedicated UI specification.



### **2.7 Assumptions and Dependencies**

The development and operation of the platform rely on several key assumptions and external dependencies.  
Any changes to these factors may impact system functionality, performance, or project scope.

---

#### **Assumptions**

**User Device Capability**  
Users are assumed to have access to modern browsers capable of running JavaScript, including Chrome, Firefox, Safari, or Edge.

**Stable Internet Access**  
A continuous internet connection is required for both users and the hosting environment.  
Offline operation is **not** supported.

**Location Permissions**  
Users are expected to grant permission for the browser to access their approximate location to enable map-based and distance-based recommendations.

**Realistic Event Volume**  
Initial user activity is assumed to consist of small-to-medium event volumes, not enterprise-scale traffic.

**User Behaviour**  
Users are expected to behave responsibly, provide accurate event information, and adhere to community guidelines.

---

#### **External Dependencies**

**Google Maps API**  
The platform relies on Google Maps for geolocation, marker rendering, and map navigation.  
Changes to pricing, quotas, or availability may affect system behaviour.

**Third-Party Libraries**  
Functionality depends on the stability of external packages (React components, npm libraries, Django modules).

**Database Engine**  
The system requires PostgreSQL/MySQL for persistent storage.  
Downtime or corruption would affect all user, event, and booking data.

**Hosting Environment**  
The hosting provider must support:
- Python & Django  
- SQL database engine  
- SSL/HTTPS  
- Static file serving

**Email/Notification Services (if used)**  
If email-based registration or password resets are implemented, the platform depends on a functioning SMTP server or external email provider.

---

#### **Project Dependencies**

- Collaboration between front-end and back-end developers is required for consistent API integration.  
- Timely delivery of UI assets, endpoints, and database schema is essential to maintain project deadlines.  
- Changes in academic or project requirements may affect scope or feature prioritisation.


## 3. External Interface Requirements

### 3.1 User Interfaces (Responsive React Web App)

The **ShoutMe** platform is delivered as a **responsive web application** accessed through a modern browser.  
The user interface is built using **React**, following a clean, minimal, and consistent design across all screens.

#### **Authentication (Login / Registration)**
Simple forms for email and password input, with validation messages displayed inline beneath invalid fields. Standard buttons: **Login, Register, and links** to switch between the two pages. 

 
#### **Home / Dashboard**
A personalized landing page showing upcoming events, recommended events, and shortcuts (e.g., “Create Event”, “Find Events Near Me”). The layout typically includes a header with the page title, a main content area with event cards, and optional filter controls. 

Layout includes a page header, event card grid, and optional filters.

#### **Event Listing & Search**
A list or grid of event “cards” showing title, date/time, location, category, and a short description. A search bar and filters (e.g., category, date, distance) appear at the top or in a sidebar. Each card includes a View Details button.

#### **Event Details & Booking**
A detail page that displays full event information (host, description, date/time, location with map, capacity, attendees).

Main actions:
- **Join/Book Event**
- **Leave Event**
- **Message Host**

Hosts also see **Edit** and **Delete** options.

#### **Event Creation / Editing**
A structured form with labelled fields (title, description, category, date, time, location, etc.). The system enforces mandatory fields and valid formats, with error messages displayed near invalid inputs. Standard buttons: Save, Cancel. 

#### **Map View (Events on Map)**
A full-screen map using the **Google Maps API**, with event markers indicating location. Clicking a marker opens a popup with summary info and a link to the event details page. Map controls include zoom, pan, and optional filters (category, radius).

#### **User Profile & Settings**
A profile page with user information (name, picture, bio, interests, upcoming/past events, friends). An Edit Profile interface allows updating these fields. Settings (e.g., notification preferences, privacy options) may appear as separate sections or tabs. 

#### **Messaging / Chat**
A messaging interface consisting of a conversation list and a message pane. Users can view past messages and send new ones via a text input box with a Send button. Optional features include unread indicators and timestamps. 

Across all screens, the following GUI standards apply: 


#### **Global Navigation Bar**
Global Navigation Bar (visible for logged-in users) 
app logo/home link, main navigation links (Home, Events, Map, Create Event, Messages, Profile), and a profile menu including Logout. 

#### **Button Conventions**
**Primary actions** (e.g., “Join”, “Save”, “Create Event”) use a distinct primary button style. 
**Destructive actions** (e.g., “Delete Event”) use a warning style and trigger a confirmation dialog. 

#### **Error & Status Messages**
Form errors are shown inline beneath the relevant field. Critical system errors or success messages (e.g., “Event created successfully”) may appear as banners or toast notifications at the top/bottom of the screen. 

#### **Keyboard & Accessibility**
Forms can be submitted with the Enter key when appropriate. Modal dialogs can be dismissed with the Esc key. All interactive components are keyboard navigable (Tab order), and text labels are associated with form controls. 

#### **Layout Constraints**
The UI is responsive and must adapt to desktop and mobile screen sizes. On smaller screens, the main navigation may collapse into a hamburger menu, and sidebars become stacked sections. 



### 3.2 Hardware Interfaces
The ShoutMe platform is a web-based application and does not directly interact with specialised hardware devices. All interaction occurs indirectly through the user’s web browser and operating system. The system must support standard consumer hardware capable of running modern browser technologies. 

 

#### **Supported Device Types:** 

The platform must operate correctly on Desktop and Laptop Computers using Windows, macOS, Linux. It will also work on mobile devices like iOS smartphones/tablets via Safari and android smartphones/tablets via Chrome. No additional peripherals or hardware-specific integrations are required. The UI must also render properly on **common screen resolutions** ranging from mobile (≈ 360px width) to large desktop displays. The Input devices should be 
keyboard and mouse/trackpad for desktop/laptop interactions and touch input for mobile browsers (tap, drag, scroll). 

### 3.3 Software Interfaces
**Client–Server Interface** 

**Client Software:** 

Web browser (Chrome, Edge, Firefox, Safari, etc.) 
Front-end implemented in React 

 

**Server Software:** 

Backend implemented in Django

Exposes a RESTful JSON API 

 

**Communication** 

Protocol: HTTPS 

Format: JSON for all requests/responses 

Authentication: JWT (JSON Web Token) sent in Authorization: Bearer <token> header for protected endpoints 

 

Backend–Database Interface 

**Database Software:** 

Relational SQL database (e.g., PostgreSQL 15.x or MySQL 8.x) 

 

Google Maps JavaScript API 

**Purpose:** 

Display maps and event markers on the front-end. 

Optional geocoding of addresses to coordinates. 

 

**Interface:**

JavaScript API loaded in the browser via script tag. The front-end sends requests to Google’s servers (not directly from the backend). 

### 3.4 Communications Interfaces
The Shout-Me platform is a web-based system and relies entirely on standard internet communication protocols for all interactions between **users, the application server, and third-party services.**

 

#### **Message Format**

All API requests and responses use JSON as the standard data format. 

 

Request: **HTTP method** (GET/POST/PUT/DELETE), URL, headers (e.g. Authorization, Content-Type: application/json), and optional JSON body. 

 

Response: **HTTP status code**, headers, JSON body containing requested data or structured error information. 

 

 

#### **Security and Encryption**

All traffic must be encrypted using TLS. Authentication uses tokens sent in the Authorization header. Sensitive data (e.g. passwords) is only sent in encrypted request bodies, never in URLs. Server-side validation and sanitization are required for all incoming data. 

 

 

#### **Data Transfers and Synchronization** 

No hard real-time guarantees, however, endpoints should be designed to minimize payload size (e.g. pagination for event listings). File uploads (e.g. profile or event images) are limited to reasonable sizes to avoid excessive bandwidth.  The Primary interaction model is stateless request–response: the client will fetch updated data via API calls as needed. If real-time chat is used: Prefer WebSockets (wss://) for low-latency, bidirectional communication, with JSON messages defining sender, receiver/conversation, content, and timestamp. As a fallback, HTTP polling or long-polling may be used. Consistency is managed server-side via database transactions; clients refresh their view by re-requesting data. 

 

 

#### **Electronic Forms** 

All user input (registration, login, event creation, profile editing, messaging) is submitted as JSON in the body of HTTPS POST/PUT requests. 

---

## 4. System Features
  
### 4.1 User Registration & Authentication (High)
 #### Functional Requirements
| ID     | Requirement |
|--------|-----------|
| REQ-1.1 | Register with email and password |
| REQ-1.2 | Passwords hashed securely |
| REQ-1.3 | JWT or Django authentication |
| REQ-1.4 | Block invalid login attempts |
| REQ-1.5 | Logout invalidates session |
| REQ-1.6 | Validate email format & password strength |

---

### 4.2 Event Discovery (High)
**Description and Priority:**   
Allows users to find events based on interests, categories, distance, and time. 

**Stimulus/Response**
1. User opens Events page. 
2. System retrieves events list based on default filters. 
3. User applies filters/search. 
4. System returns updated results. 

 #### Functional Requirements
| ID     | Requirement |
|--------|-----------|
| REQ-2.1 | Browse all public events |
| REQ-2.2 | Text-based search |
| REQ-2.3 | Filter by date, time, radius, category |
| REQ-2.4 | Sort by relevance/date |
| REQ-2.5 | Pagination / limited results |  

---


### 4.3 Event Details Page (High)
**Description and Priority:**  
Displays full information about a specific event. 


 

**Stimulus/Response** 
1. User selects event. 
2. System loads event details, location, host information, and current attendees. 
3. UI displays action buttons (Join/Edit/Delete depending on user). 

 #### Functional Requirements
| ID     | Requirement |
|--------|-----------|
| REQ-3.1 | Show all event fields + map |
| REQ-3.2 | Display host & attendee count |
| REQ-3.3 | Embedded map with location pin |
| REQ-3.4 | Role-based actions (Join/Edit/Delete) |

---

### 4.4 Event Creation & Management (High)

**Description and Priority:**   
Users can create and manage their own events. 

**Stimulus/Response**
1. User clicks “Create Event”. 
2. System displays event creation form. 
3. User submits form.
4. System validates and saves event. 
5. Event becomes visible on platform.

 #### Functional Requirements
| ID     | Requirement |
|--------|-----------|
| REQ-4.1–4.2 | Create with required fields + validation |
| REQ-4.3–4.4 | Host-only edit |
| REQ-4.5–4.6 | Host-only delete with confirmation |

---

### 4.5 Event Booking (Join / Leave Events) (High)

 **Description and Priority:**  
 Users can join or leave events; the system manages event capacity. 
 

 

**Stimulus/Response**
1. User clicks “Join Event”. 
2. System checks availability and user eligibility. 
3. System confirms booking or returns error. 

#### Functional Requirements
| ID     | Requirement |
|--------|-----------|
| REQ-5.1 | Join public events |
| REQ-5.2 | Prevent duplicate joins |
| REQ-5.3 | Hosts cannot join own events |
| REQ-5.4–5.6 | Capacity handling, confirmation messages |

---

### **4.6 Map-Based Event Discovery (Medium-High)**

**Description and Priority:**   
Users can find nearby events displayed on an interactive Google Map.  


**Stimulus/Response**  
1. User opens the **Map** tab.  
2. System loads all events in the visible map region.  
3. User clicks an event marker.  
4. System shows an event preview popup.

#### Functional Requirements
| ID         | Requirement |
|------------|-------------|
| REQ-6.1| Display events as markers on a map |
| REQ-6.2 | Update markers dynamically when map is moved or zoomed |
| REQ-6.3 | Show event details in a marker popup |
| REQ-6.4 | Support filtering directly on the map interface |
| REQ-6.5 | Request and use user geolocation (with permission) |

---

### **4.7 User Profile Management (Medium-High)**

**Description and Priority:**  
Users can manage personal information, interests, and profile image.  


**Stimulus/Response**  
1. User opens **Profile** page.  
2. System loads stored user information.  
3. User edits fields and submits changes.  
4. System validates input and updates profile.

#### Functional Requirements
| ID         | Requirement |
|------------|-------------|
| REQ-7.1 | Allow users to view and edit their profile |
| REQ-7.2 | Allow users to upload or change a profile image |
| REQ-7.3 | Allow users to add or update interests |
| REQ-7.4 | Show user’s upcoming and past events |
| REQ-7.5 | Restrict editing privileges to the profile owner |

---

### **4.8 Social Features (Friends & Messaging) (Medium)**

**Description and Priority:**  
Supports social interaction, friend connections, and messaging.  


**Stimulus/Response**  
1. User sends a **friend request**.  
2. System notifies the recipient.  
3. Recipient accepts or rejects.  
4. Messaging becomes available after acceptance.

#### Functional Requirements
| ID         | Requirement |
|------------|-------------|
| REQ-8.1 | Allow users to send friend requests |
| REQ-8.2 | Allow recipients to accept or reject requests |
| REQ-8.3 | Allow users to view and manage their friend list |
| REQ-8.4 | Enable messaging between connected friends |
| REQ-8.5| Support a conversation view with timestamps |
| REQ-8.6 | Block messaging between users who are not connected (unless host-only messaging is enabled) |

---

### **4.9 Admin Management & Moderation (Medium-Low)**

**Description and Priority:**  
Admins maintain platform safety, manage users, and remove harmful content.  

**Stimulus/Response**  
1. Admin logs into the **admin panel**.  
2. Admin views lists of users/events.  
3. Admin selects a user or event to flag/remove.  
4. System updates records and logs the action.

#### Functional Requirements
| ID         | Requirement |
|------------|-------------|
| REQ-9.1 | Allow admins to remove inappropriate or harmful events |
| REQ-9.2 | Allow admins to deactivate or suspend user accounts |
| REQ-9.3 | Maintain logs of all admin actions |
| REQ-9.4 | Restrict access to admin panel to admin-level users only |

---

## 5. Other Nonfunctional Requirements

### 5.1 Performance Requirements
#### **General Responsiveness** 

**PR-1:** For typical user interactions (page navigation, viewing events, opening profiles), the page load time should be ≤ 2 seconds on a standard broadband connection. 
Rationale: Ensures the application feels responsive and reduces user abandonment. 

 

**PR-2:** API responses for common operations (fetching event lists, event details, profile data) should have a server processing time of ≤ 500 ms under normal load, excluding network latency. 
Rationale: Keeps UI updates smoothly and supports responsive front-end behaviour. 

 

#### **Event Search and Listing**

**PR-3:** When a user searches for events or applies filters (by category, date, or distance), the system should return the first page of results in ≤ 1 second of server processing time. 
Rationale: Search and browsing are core actions; delays here directly impact usability. 

 

**PR-4:** Event listings should support pagination or incremental loading to limit each response to a manageable number of records (e.g. 20–50 events per page). 
Rationale: Prevents excessively large payloads and reduces both server and client processing time. 



#### **Map and Location Features** 

**PR-5:** The map view (with event markers) should become interactive within ≤ 3 seconds of the user opening the map page, assuming a stable internet connection. 
Rationale: Maps are visually heavier; this sets a realistic but user-friendly expectation. 

 

**PR-6:** Adding or updating markers (e.g. after applying filters) should complete in ≤ 1 second from the time the filter is applied. 
Rationale: Supports fluid exploration of events on the map. 

 

 

#### **Event Creation, Booking, and Updates** 

**PR-7:** Submitting an event creation or edit form should complete in ≤ 1 second, and confirmation should be shown immediately after. 
Rationale: Creators must see quick feedback to avoid duplicate submissions. 

 

**PR-8:** Booking or joining an event must complete in ≤ 1 second of server processing time, and the updated attendance state (e.g. booked/confirmed) must be visible to the user within the same interaction. 
Rationale: Booking is a critical path; slow feedback will cause confusion or double-clicking. 

 

 
 

#### **Data Storage and Capacity** 

**PR-9:** The database must support at least: 

10,000 user records 

5,000 event records 

50,000 booking records 
without requiring architectural changes. 
Rationale: Ensures the design scales beyond trivial sample data. 

 

**PR-10:** Indexes must be used on frequently queried fields (e.g. event date, location, category, user ID) to keep query times within the performance limits defined above. 
Rationale: Prevents performance collapse as data volume increases. 

 

#### **Real-Time / Messaging (If Implemented)**

**PR-11:** For real-time messaging using WebSockets, messages should appear in the recipient’s chat view within ≤ 1 second of being sent, under normal network conditions. 
Rationale: Provides a near real-time chat experience suitable for coordinating events. 

 

If any of these performance targets cannot be met due to environment constraints (e.g. very low bandwidth), the system must still behave correctly and display appropriate feedback to users(e.g. loading indicators, retry messages). 

### 5.2 Safety Requirements
**SR-1:** Prevention of Accidental Data Loss 

The system must prevent irreversible actions without explicit confirmation. This is done to prevent accidental loss of data due to misclicks or unintended user actions. Examples include: **Deleting an event, Removing a user account, Cancelling a booking.**

 

Each of these actions must trigger a confirmation dialog: 
**“Are you sure you want to delete this event? This action cannot be undone.”**

 

**SR-2:** Protection Against Data Corruption 

All database write operations (event creation, booking, profile updates) must be performed within **atomic transactions** to prevent partial or inconsistent data states. 

In case of system failure during an operation, the database must roll back to a safe, consistent state. 

Ensures system integrity and prevents corrupted or invalid records. 

 

. 

**SR-3:** Safe Event Management 

The system must clearly show event location, date, and host information to prevent users from attending events under **false assumptions**. event hosts must agree to platform policies before publishing events. 

 

For community safety, events must not be allowed to: **Use hateful, dangerous, or illegal descriptions, Promote harmful activities, Admins must have the ability to remove events that violate safety or community guidelines. **

This is all done to reduce risk of users attending unsafe or inappropriate events. 

### 5.3 Security Requirements
**SRE-1:** Compliance with Data Protection Policies 

The platform must comply with general data safety standards, including GDPR principles for projects operating in the EU environment. 

 

Users must be informed about: **How their data is stored, how to request deletion of their data, what information is visible to others.**

 

**SRE-2:** Authentication and Access Control Safety 

The system must prevent unauthorized access to: User accounts, Event creation tools, administrative functions, Login attempts must be rate-limited to prevent **brute-force attacks**, Passwords must never be stored or transmitted in **plain text**. This is done to protect user identity and prevent harmful account takeovers. 

 

**SRE-3:** Safety Certifications 

As a student project, Shout-Me does not require formal safety certifications, but it must adhere to: 

General web safety and security guidelines **Browser and API usage policies** such as Google Maps terms of use GDPR-compliant data handling practices  to ensures the platform is safe for general use, even without commercial certifications. 

 

**SEC-4:** User Authentication 
Users must authenticate using a valid email and password. Passwords must be stored using **secure hashing**. The system must use **JWT tokens for protected API access** to ensure only authorised users can interact with private data or features. 

 

**SEC-5:** Access Control Enforcement 
Users may only access or modify their own data. Event creators can **edit or delete** only their own events. Administrative functions must be restricted to authorised admin accounts. All sensitive endpoints must include server-side role and permission checks. 

 

**SRE-6:** Data Encryption in Transit 
All communication between client and server must use **HTTPS/TLS**. No sensitive data may be transmitted over unencrypted HTTP. *WebSocket communication** (if used for messaging) must use WSS to prevent interception and eavesdropping. 

 

**SEC-7:** Personal Data Protection 
Personal information including **account details, event attendance, messages, and profile data** must not be visible to other users unless explicitly allowed. Users must be able to request deletion of their account and associated data to **uphold privacy rights.**

### 5.4 Software Quality Attributes
**SQA-1: Usability**
The platform must provide a clean, intuitive interface that allows new users to register, browse events, and join events without requiring a tutorial. Core actions (login, event browsing, booking) must require no more than 3 user interactions each to complete. Ease of use is prioritized over advanced customization. 

 

**SQA-2: Reliability**
The system must operate correctly during normal use with minimal failures. Under typical usage **(≤ 50 concurrent users)**, the application must maintain **≥ 99% uptime** during testing periods. Any server error must return a clear, non-technical message without compromising data integrity. 

 

**SQA-3: Availability**
The system must be accessible at all times during project demonstrations and testing sessions. Scheduled maintenance tasks must **not exceed 5 minutes** and must not cause data loss. 

 

**SQA-4: Maintainability** 
The source code must follow modular and component-based design principles. Developers should be able to **modify or extend individual features** (e.g., event creation, chat, profiles) without affecting unrelated components. All code should be commented and structured for ease of updates. 

 

**SQA-5: Adaptability** 
The platform should support adding new **event categories, new profile fields, or new social features** without major architectural changes. The front-end must be adaptable to both desktop and mobile layouts using responsive design. 

 

**SQA-6: Portability** 
The application must run on any modern browser **(Chrome, Firefox, Edge, Safari)** without requiring installation. For deployment, it must run on standard Linux or cloud environments using **Python, Django, React, and SQL,** without hardware-specific dependencies. 

 

**SQA-7: Performance Efficiency** 
All core pages must load within 2 seconds on a standard broadband connection. The system must handle up to 50 concurrent users without noticeable degradation in responsiveness. 

 

**SQA-8: Interoperability** 
The system must work seamlessly with integrated APIs such as Google Maps. Data exchanged between components must be in consistent JSON format to allow smooth interaction across front-end, back-end, and external services. 

 

**SQA-9: Testability** 
All major features **(authentication, event creation, booking, profile updates)** must be testable through automated or manual test cases. API endpoints must return predictable and structured JSON responses to support automated testing. 

 

**SQA-10: Robustness** 
The system must handle **invalid input, network interruptions, and unexpected user** behaviours without crashing. In all such cases, it must display safe error messages and maintain data consistency. 

 

**SQA-11: Reusability**
Common components **(e.g., event card, profile card, input fields, buttons)** must be implemented as reusable React components to reduce duplicated code and simplify future development. 

### 5.5 Business Rules
**BR-1: Event Ownership**
Only the user who created an event (the event host) may edit or delete that event. Other users cannot modify host-owned events under any circumstances. 

 

**BR-2: Booking Permissions**
Users may book or join any public event unless the event has reached its maximum capacity (if capacity is set). Hosts cannot book their own events. 

 

**BR-3: Role-Based Restrictions**
System administrators have elevated privileges such as removing inappropriate events or banning users. Regular users cannot access administrator functions. 

 

**BR-4: Profile Visibility**
A user’s basic profile information (name, picture, interests) may be visible to other users, but private details (email, password, account settings) must remain hidden at all times. 

 

**BR-5: Event Content Guidelines**
Events must comply with platform rules and may not contain hateful, illegal, or harmful content. Hosts are responsible for ensuring their events meet these guidelines. 

 

**BR-6: Messaging Safety Rules**
Users may only message people they are connected with (e.g., friends or event hosts). **Spam, harassment, or abusive behavior** is prohibited and may lead to account suspension. 

 

**BR-7: Age Restrictions**
Users must be **at least 16 years old** to create an account and participate on the platform. Events intended for adults must be clearly labelled. 

 

**BR-8: Data Accuracy** 
Users are responsible for providing accurate information in their profiles and events. Misleading or false data violates platform policies. 

 

**BR-9: Cancellation & No-Show Rules**
If a user cancels a booking or fails to attend, hosts may remove them from future attendance lists or mark them as inactive (optional future feature). 

 

**BR-10: External API Compliance**
Any use of **third-party APIs** (e.g., Google Maps) must follow the provider’s terms of service. Violations may result in restricted access or application errors. 

---

## **6. Other Requirements**

This section outlines additional requirements that do not fall under previous categories but are necessary for the correct operation, maintainability, and compliance of the ShoutMe platform.

### **OR-1: Database Capacity**
The system’s database must support:
- A minimum of **10,000 registered users**
- At least **5,000 events**
- At least **50,000 booking records**

This ensures the platform can scale beyond small test datasets and operate effectively during peak usage periods.

---

## **Appendix A: Glossary**

| Term | Meaning |
|------|---------|
| **IA** | Intended Audience |
| **REF** | References |
| **PR** | Performance Requirements |
| **SRE** | Safety Requirements |
| **SEC** | Security Requirements |
| **SQA** | Software Quality Attributes |
| **BR** | Business Rules |
| **UI** | User Interface |
| **API** | Application Programming Interface |
| **JWT** | JSON Web Token |
| **DB** | Database |

## Appendix B: Analysis Models
![ER Diagram](docs/images/ER.png)

## Appendix C: To Be Determined List
The rest of the other requirements are yet to be decided.

---
**End of Document**