import React, { useState } from 'react';
import './DogRescueDashboard.css';

const DogRescueDashboard = () => {
    const [activeSection, setActiveSection] = useState('overview');
    const [dogs, setDogs] = useState([
        {
            id: 1,
            name: 'Max',
            breed: 'Labrador Mix',
            age: '3 years',
            status: 'available',
            intakeDate: '2025-05-15',
            photo: '🐕',
            medical: { vaccinated: true, spayedNeutered: true, nextAppointment: '2025-06-15' },
            behavioral: 'Friendly, good with kids',
            foster: null
        },
        {
            id: 2,
            name: 'Luna',
            breed: 'German Shepherd',
            age: '2 years',
            status: 'pending',
            intakeDate: '2025-05-20',
            photo: '🐕‍🦺',
            medical: { vaccinated: true, spayedNeutered: false, nextAppointment: '2025-06-05' },
            behavioral: 'Needs training, energetic',
            foster: 'John Smith'
        }
    ]);

    const [applications, setApplications] = useState([
        { id: 1, applicantName: 'Sarah Johnson', dogName: 'Max', status: 'under review', date: '2025-05-28' },
        { id: 2, applicantName: 'Mike Davis', dogName: 'Luna', status: 'approved', date: '2025-05-30' }
    ]);

    const [tasks, setTasks] = useState([
        { id: 1, task: 'Feed all dogs', time: '8:00 AM', completed: false, assignee: 'Staff' },
        { id: 2, task: 'Walk Max', time: '9:00 AM', completed: false, assignee: 'Volunteer A' },
        { id: 3, task: 'Administer medication to Luna', time: '10:00 AM', completed: false, assignee: 'Staff' }
    ]);

    const [financials] = useState({
        adoptionFees: 2500,
        medicalExpenses: 3200,
        donations: 5000,
        operatingCosts: 4000
    });

    const renderOverview = () => (
        <div className="drd-overview">
            <div className="drd-stats-grid">
                <div className="drd-stat-card">
                    <h3>Total Dogs</h3>
                    <p className="drd-stat-number">{dogs.length}</p>
                </div>
                <div className="drd-stat-card">
                    <h3>Available for Adoption</h3>
                    <p className="drd-stat-number">{dogs.filter(d => d.status === 'available').length}</p>
                </div>
                <div className="drd-stat-card">
                    <h3>Pending Applications</h3>
                    <p className="drd-stat-number">{applications.filter(a => a.status === 'under review').length}</p>
                </div>
                <div className="drd-stat-card">
                    <h3>Monthly Donations</h3>
                    <p className="drd-stat-number">${financials.donations}</p>
                </div>
            </div>

            <div className="drd-quick-actions">
                <h3>Quick Actions</h3>
                <div className="drd-action-buttons">
                    <button className="drd-action-btn">Add New Dog</button>
                    <button className="drd-action-btn">Process Application</button>
                    <button className="drd-action-btn">Schedule Volunteer</button>
                    <button className="drd-action-btn">Record Donation</button>
                </div>
            </div>

            <div className="drd-recent-activity">
                <h3>Recent Activity</h3>
                <ul className="drd-activity-list">
                    <li>New application received for Max - 2 hours ago</li>
                    <li>Luna's medical check completed - 5 hours ago</li>
                    <li>Donation of $500 received - 1 day ago</li>
                    <li>Buddy adopted successfully - 2 days ago</li>
                </ul>
            </div>
        </div>
    );

    const renderDogManagement = () => (
        <div className="drd-dog-management">
            <div className="drd-section-header">
                <h2>Dog Management</h2>
                <button className="drd-add-btn">+ Add New Dog</button>
            </div>

            <div className="drd-dog-grid">
                {dogs.map(dog => (
                    <div key={dog.id} className="drd-dog-card">
                        <div className="drd-dog-header">
                            <span className="drd-dog-photo">{dog.photo}</span>
                            <div>
                                <h3>{dog.name}</h3>
                                <p>{dog.breed} • {dog.age}</p>
                            </div>
                        </div>

                        <div className="drd-dog-details">
                            <div className="drd-status-badge" data-status={dog.status}>
                                {dog.status.charAt(0).toUpperCase() + dog.status.slice(1)}
                            </div>

                            <div className="drd-dog-info">
                                <p><strong>Intake Date:</strong> {dog.intakeDate}</p>
                                <p><strong>Medical:</strong> {dog.medical.vaccinated ? '✓' : '✗'} Vaccinated,
                                    {dog.medical.spayedNeutered ? ' ✓' : ' ✗'} Spayed/Neutered</p>
                                <p><strong>Next Appointment:</strong> {dog.medical.nextAppointment}</p>
                                <p><strong>Behavioral:</strong> {dog.behavioral}</p>
                                {dog.foster && <p><strong>Foster:</strong> {dog.foster}</p>}
                            </div>

                            <div className="drd-dog-actions">
                                <button className="drd-small-btn">Edit</button>
                                <button className="drd-small-btn">Medical Records</button>
                                <button className="drd-small-btn">Print Profile</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderAdoptions = () => (
        <div className="drd-adoptions">
            <div className="drd-section-header">
                <h2>Adoption Applications</h2>
                <div className="drd-filter-group">
                    <select className="drd-filter-select">
                        <option>All Applications</option>
                        <option>Under Review</option>
                        <option>Approved</option>
                        <option>Denied</option>
                    </select>
                </div>
            </div>

            <div className="drd-applications-table">
                <table>
                    <thead>
                    <tr>
                        <th>Applicant Name</th>
                        <th>Dog</th>
                        <th>Application Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {applications.map(app => (
                        <tr key={app.id}>
                            <td>{app.applicantName}</td>
                            <td>{app.dogName}</td>
                            <td>{app.date}</td>
                            <td>
                  <span className="drd-app-status" data-status={app.status.replace(' ', '-')}>
                    {app.status}
                  </span>
                            </td>
                            <td>
                                <button className="drd-small-btn">View</button>
                                <button className="drd-small-btn">Process</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="drd-adoption-process">
                <h3>Adoption Process Steps</h3>
                <div className="drd-process-steps">
                    <div className="drd-step">1. Application Received</div>
                    <div className="drd-step">2. Background Check</div>
                    <div className="drd-step">3. Home Visit</div>
                    <div className="drd-step">4. Meet & Greet</div>
                    <div className="drd-step">5. Adoption Complete</div>
                </div>
            </div>
        </div>
    );

    const renderOperations = () => (
        <div className="drd-operations">
            <div className="drd-operations-grid">
                <div className="drd-kennel-occupancy">
                    <h3>Kennel Occupancy</h3>
                    <div className="drd-kennel-grid">
                        {[1,2,3,4,5,6,7,8].map(kennel => (
                            <div
                                key={kennel}
                                className={`drd-kennel ${kennel <= dogs.length ? 'occupied' : 'empty'}`}
                            >
                                K{kennel}
                            </div>
                        ))}
                    </div>
                    <p className="drd-occupancy-rate">Occupancy: {dogs.length}/8 (75%)</p>
                </div>

                <div className="drd-daily-tasks">
                    <h3>Daily Tasks</h3>
                    <div className="drd-task-list">
                        {tasks.map(task => (
                            <div key={task.id} className="drd-task-item">
                                <input
                                    type="checkbox"
                                    checked={task.completed}
                                    onChange={() => {
                                        setTasks(tasks.map(t =>
                                            t.id === task.id ? {...t, completed: !t.completed} : t
                                        ));
                                    }}
                                />
                                <div className="drd-task-details">
                                    <span className="drd-task-name">{task.task}</span>
                                    <span className="drd-task-meta">{task.time} • {task.assignee}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="drd-volunteer-schedule">
                    <h3>Today's Volunteers</h3>
                    <div className="drd-volunteer-list">
                        <div className="drd-volunteer-slot">
                            <span className="drd-time-slot">9:00 AM - 12:00 PM</span>
                            <span className="drd-volunteer-name">Alice Johnson</span>
                        </div>
                        <div className="drd-volunteer-slot">
                            <span className="drd-time-slot">12:00 PM - 3:00 PM</span>
                            <span className="drd-volunteer-name">Bob Smith</span>
                        </div>
                        <div className="drd-volunteer-slot">
                            <span className="drd-time-slot">3:00 PM - 6:00 PM</span>
                            <span className="drd-volunteer-name">Carol White</span>
                        </div>
                    </div>
                </div>

                <div className="drd-inventory">
                    <h3>Inventory Status</h3>
                    <div className="drd-inventory-items">
                        <div className="drd-inventory-item">
                            <span>Dog Food</span>
                            <div className="drd-inventory-bar">
                                <div className="drd-inventory-fill" style={{width: '70%'}}></div>
                            </div>
                            <span>70%</span>
                        </div>
                        <div className="drd-inventory-item">
                            <span>Medical Supplies</span>
                            <div className="drd-inventory-bar">
                                <div className="drd-inventory-fill" style={{width: '45%'}}></div>
                            </div>
                            <span>45%</span>
                        </div>
                        <div className="drd-inventory-item">
                            <span>Cleaning Supplies</span>
                            <div className="drd-inventory-bar">
                                <div className="drd-inventory-fill" style={{width: '85%'}}></div>
                            </div>
                            <span>85%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderFinancials = () => (
        <div className="drd-financials">
            <h2>Financial Overview</h2>

            <div className="drd-financial-summary">
                <div className="drd-financial-card income">
                    <h3>Income</h3>
                    <p className="drd-amount">${financials.adoptionFees + financials.donations}</p>
                    <ul className="drd-financial-breakdown">
                        <li>Adoption Fees: ${financials.adoptionFees}</li>
                        <li>Donations: ${financials.donations}</li>
                    </ul>
                </div>

                <div className="drd-financial-card expenses">
                    <h3>Expenses</h3>
                    <p className="drd-amount">${financials.medicalExpenses + financials.operatingCosts}</p>
                    <ul className="drd-financial-breakdown">
                        <li>Medical: ${financials.medicalExpenses}</li>
                        <li>Operating: ${financials.operatingCosts}</li>
                    </ul>
                </div>

                <div className="drd-financial-card balance">
                    <h3>Net Balance</h3>
                    <p className="drd-amount">
                        ${(financials.adoptionFees + financials.donations) - (financials.medicalExpenses + financials.operatingCosts)}
                    </p>
                </div>
            </div>

            <div className="drd-recent-transactions">
                <h3>Recent Transactions</h3>
                <table className="drd-transaction-table">
                    <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Amount</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>2025-06-01</td>
                        <td>Adoption fee - Max</td>
                        <td>Income</td>
                        <td className="drd-income">+$250</td>
                    </tr>
                    <tr>
                        <td>2025-05-31</td>
                        <td>Vet visit - Luna</td>
                        <td>Medical</td>
                        <td className="drd-expense">-$180</td>
                    </tr>
                    <tr>
                        <td>2025-05-30</td>
                        <td>Monthly donation - J. Smith</td>
                        <td>Donation</td>
                        <td className="drd-income">+$100</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderCommunications = () => (
        <div className="drd-communications">
            <h2>Communications</h2>

            <div className="drd-comm-grid">
                <div className="drd-comm-section">
                    <h3>Automated Messages</h3>
                    <div className="drd-message-templates">
                        <div className="drd-template">
                            <h4>Application Received</h4>
                            <p>Sent to applicants upon submission</p>
                            <button className="drd-small-btn">Edit Template</button>
                        </div>
                        <div className="drd-template">
                            <h4>Adoption Approved</h4>
                            <p>Sent when application is approved</p>
                            <button className="drd-small-btn">Edit Template</button>
                        </div>
                        <div className="drd-template">
                            <h4>Follow-up Check</h4>
                            <p>Sent 30 days post-adoption</p>
                            <button className="drd-small-btn">Edit Template</button>
                        </div>
                    </div>
                </div>

                <div className="drd-comm-section">
                    <h3>Newsletter</h3>
                    <div className="drd-newsletter-stats">
                        <p>Subscribers: 1,245</p>
                        <p>Last Sent: May 15, 2025</p>
                        <p>Open Rate: 42%</p>
                    </div>
                    <button className="drd-action-btn">Create Newsletter</button>
                </div>

                <div className="drd-comm-section">
                    <h3>Social Media</h3>
                    <div className="drd-social-actions">
                        <button className="drd-social-btn">Feature Dog of the Week</button>
                        <button className="drd-social-btn">Share Success Story</button>
                        <button className="drd-social-btn">Post Event</button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderReports = () => (
        <div className="drd-reports">
            <h2>Reports & Analytics</h2>

            <div className="drd-report-grid">
                <div className="drd-report-card">
                    <h3>Adoption Metrics</h3>
                    <div className="drd-metric">
                        <span>Success Rate</span>
                        <span className="drd-metric-value">92%</span>
                    </div>
                    <div className="drd-metric">
                        <span>Average Stay</span>
                        <span className="drd-metric-value">21 days</span>
                    </div>
                    <div className="drd-metric">
                        <span>Returns</span>
                        <span className="drd-metric-value">3%</span>
                    </div>
                </div>

                <div className="drd-report-card">
                    <h3>Intake Sources</h3>
                    <div className="drd-source-list">
                        <div className="drd-source">
                            <span>Owner Surrender</span>
                            <span>45%</span>
                        </div>
                        <div className="drd-source">
                            <span>Stray</span>
                            <span>30%</span>
                        </div>
                        <div className="drd-source">
                            <span>Transfer</span>
                            <span>25%</span>
                        </div>
                    </div>
                </div>

                <div className="drd-report-card">
                    <h3>Medical Costs</h3>
                    <div className="drd-cost-breakdown">
                        <div className="drd-cost-item">
                            <span>Average per dog</span>
                            <span>$450</span>
                        </div>
                        <div className="drd-cost-item">
                            <span>Monthly total</span>
                            <span>$3,200</span>
                        </div>
                        <div className="drd-cost-item">
                            <span>YTD total</span>
                            <span>$15,800</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="drd-report-actions">
                <button className="drd-action-btn">Generate Monthly Report</button>
                <button className="drd-action-btn">Export Data</button>
                <button className="drd-action-btn">Email Report</button>
            </div>
        </div>
    );

    const renderContent = () => {
        switch(activeSection) {
            case 'overview': return renderOverview();
            case 'dogs': return renderDogManagement();
            case 'adoptions': return renderAdoptions();
            case 'operations': return renderOperations();
            case 'financials': return renderFinancials();
            case 'communications': return renderCommunications();
            case 'reports': return renderReports();
            default: return renderOverview();
        }
    };

    return (
        <div className="drd-container">
            <header className="drd-header">
                <h1 className="drd-title">🐾 Paws & Love Rescue Dashboard</h1>
                <div className="drd-header-actions">
                    <span className="drd-user">Welcome, Admin</span>
                    <button className="drd-logout-btn">Logout</button>
                </div>
            </header>

            <nav className="drd-nav">
                <button
                    className={`drd-nav-btn ${activeSection === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveSection('overview')}
                >
                    Overview
                </button>
                <button
                    className={`drd-nav-btn ${activeSection === 'dogs' ? 'active' : ''}`}
                    onClick={() => setActiveSection('dogs')}
                >
                    Dog Management
                </button>
                <button
                    className={`drd-nav-btn ${activeSection === 'adoptions' ? 'active' : ''}`}
                    onClick={() => setActiveSection('adoptions')}
                >
                    Adoptions
                </button>
                <button
                    className={`drd-nav-btn ${activeSection === 'operations' ? 'active' : ''}`}
                    onClick={() => setActiveSection('operations')}
                >
                    Operations
                </button>
                <button
                    className={`drd-nav-btn ${activeSection === 'financials' ? 'active' : ''}`}
                    onClick={() => setActiveSection('financials')}
                >
                    Financials
                </button>
                <button
                    className={`drd-nav-btn ${activeSection === 'communications' ? 'active' : ''}`}
                    onClick={() => setActiveSection('communications')}
                >
                    Communications
                </button>
                <button
                    className={`drd-nav-btn ${activeSection === 'reports' ? 'active' : ''}`}
                    onClick={() => setActiveSection('reports')}
                >
                    Reports
                </button>
            </nav>

            <main className="drd-main">
                {renderContent()}
            </main>
        </div>
    );
};

export default DogRescueDashboard;