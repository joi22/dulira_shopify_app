import React, { useState } from 'react';
import { X, ShoppingBag, CreditCard, Settings, Share2 } from 'lucide-react';

const DukiraLookModal = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('look');
  
  const lookItems = [
    {
      id: 1,
      name: 'Glamour Glasses',
      date: '9 July 2025',
      itemNumber: '#2889',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop'
    },
    {
      id: 2,
      name: 'Glamour Glasses',
      date: '9 July 2025',
      itemNumber: '#2889',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop'
    },
    {
      id: 3,
      name: 'Glamour Glasses',
      date: '9 July 2025',
      itemNumber: '#2889',
      image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&h=150&fit=crop'
    }
  ];

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .app-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background-color: #f3f4f6;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .open-btn {
          padding: 12px 24px;
          background-color: #10b981;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          font-weight: 500;
        }

        .open-btn:hover {
          background-color: #059669;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-container {
          display: flex;
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          max-width: 1000px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
        }

        .sidebar {
          width: 260px;
          background: linear-gradient(to bottom, #22c55e, #16a34a);
          color: white;
          display: flex;
          flex-direction: column;
        }

        .sidebar-logo {
          padding: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .logo-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
          background-color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #22c55e;
          font-weight: bold;
          font-size: 14px;
        }

        .logo-text {
          font-size: 20px;
          font-weight: bold;
        }

        .sidebar-nav {
          flex: 1;
          padding: 16px;
        }

        .nav-button {
          width: 100%;
          padding: 16px;
          background-color: transparent;
          border: none;
          border-radius: 8px;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          margin-bottom: 8px;
          font-size: 15px;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .nav-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .nav-button.active {
          background-color: rgba(255, 255, 255, 1);
          color: #01CB76;
        }

        .sidebar-footer {
          padding: 16px;
          text-align: center;
        }

        .dimensions-badge {
          display: inline-block;
          background-color: #3b82f6;
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          max-height: 90vh;
        }

        .modal-header {
          border-bottom: 1px solid #e5e7eb;
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .header-text h2 {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .header-text p {
          color: #6b7280;
          font-size: 14px;
        }

        .close-btn {
          width: 40px;
          height: 40px;
          background-color: #1f2937;
          color: white;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .close-btn:hover {
          background-color: #374151;
        }

        .items-container {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .item-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 16px;
          transition: box-shadow 0.2s;
        }

        .item-card:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .item-image {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 8px;
        }

        .item-info {
          flex: 1;
        }

        .item-name {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .item-date {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 2px;
        }

        .item-number {
          font-size: 14px;
          color: #9ca3af;
        }

        .item-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          padding: 8px 16px;
          background-color: #1f2937;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .action-btn:hover {
          background-color: #374151;
        }

        .action-btn.buy {
          background-color: #10b981;
        }

        .action-btn.buy:hover {
          background-color: #059669;
        }

        .share-btn {
          width: 40px;
          height: 40px;
          background-color: #1f2937;
          color: white;
          border: none;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .share-btn:hover {
          background-color: #374151;
        }

        .payment-content {
          max-width: 800px;
        }

        .payment-section {
          margin-bottom: 40px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 12px;
        }

        .section-description {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .add-card-btn {
          padding: 12px 24px;
          background-color: #10b981;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .add-card-btn:hover {
          background-color: #059669;
        }

        .invoices-section {
          margin-top: 40px;
        }

        .invoices-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
        }

        .invoices-table thead {
          background-color: #f9fafb;
        }

        .invoices-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          border-bottom: 2px solid #e5e7eb;
        }

        .invoices-table td {
          padding: 16px;
          font-size: 14px;
          color: #6b7280;
          border-bottom: 1px solid #e5e7eb;
        }

        .empty-state {
          text-align: center;
          padding: 40px 16px !important;
          color: #9ca3af;
        }

        .setting-content {
          max-width: 800px;
        }
      `}</style>

      <div className="app-container">
        <button className="open-btn" onClick={() => setIsOpen(true)}>
          Open Your Look
        </button>

        {isOpen && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="sidebar">
                <div className="sidebar-logo">
                  <div className="logo-content">
                    <div className="logo-icon">D</div>
                    <span className="logo-text">DUKIRA</span>
                  </div>
                </div>

                <nav className="sidebar-nav">
                  <button 
                    className={`nav-button ${activeTab === 'look' ? 'active' : ''}`}
                    onClick={() => setActiveTab('look')}
                  >
                    <ShoppingBag size={32} />
                    <span>Your Look</span>
                  </button>
                  
                  <button 
                    className={`nav-button ${activeTab === 'payment' ? 'active' : ''}`}
                    onClick={() => setActiveTab('payment')}
                  >
                    <CreditCard size={32} />
                    <span>Payment</span>
                  </button>
                  
                  <button 
                    className={`nav-button ${activeTab === 'setting' ? 'active' : ''}`}
                    onClick={() => setActiveTab('setting')}
                  >
                    <Settings size={32} />
                    <span>Setting</span>
                  </button>
                </nav>

                <div className="sidebar-footer">
                  <div className="dimensions-badge">346 × 1324</div>
                </div>
              </div>

              <div className="main-content">
                <div className="modal-header">
                  <div className="header-text">
                    <h2>{activeTab === 'look' ? 'Your Look' : activeTab === 'payment' ? 'Payment' : 'Setting'}</h2>
                    <p>
                      {activeTab === 'look' && 'Like your own fitting room, anytime you shop'}
                      {activeTab === 'payment' && 'Manage your payment methods and view your purchase history.'}
                      {activeTab === 'setting' && 'Manage your account settings and preferences.'}
                    </p>
                  </div>
                  <button className="close-btn" onClick={() => setIsOpen(false)}>
                    <X size={20} />
                  </button>
                </div>

                <div className="items-container">
                  {activeTab === 'look' && lookItems.map((item) => (
                    <div key={item.id} className="item-card">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="item-image"
                      />
                      
                      <div className="item-info">
                        <div className="item-name">{item.name}</div>
                        <div className="item-date">{item.date}</div>
                        <div className="item-number">{item.itemNumber}</div>
                      </div>

                      <div className="item-actions">
                        <button className="action-btn">View</button>
                        <button className="action-btn">✏ Edit</button>
                        <button className="action-btn buy">Buy</button>
                      </div>

                      <button className="share-btn">
                        <Share2 size={16} />
                      </button>
                    </div>
                  ))}

                  {activeTab === 'payment' && (
                    <div className="payment-content">
                      <div className="payment-section">
                        <h3 className="section-title">Payment Methods</h3>
                        <p className="section-description">
                          No payment method yet click "Add New Card" to add your Payment
                        </p>
                        <button className="add-card-btn">
                          + Add New Card
                        </button>
                      </div>

                      <div className="invoices-section">
                        <h3 className="section-title">Invoices</h3>
                        <table className="invoices-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Item</th>
                              <th>Amount</th>
                              <th>Invoice</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td colspan="4" className="empty-state">No invoices available</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab === 'setting' && (
                    <div className="setting-content">
                      <h3 className="section-title">Settings</h3>
                      <p className="section-description">Configure your preferences here.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DukiraLookModal;