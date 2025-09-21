import React from 'react';

const RewardsCard = () => {
  const cardStyle = {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    maxWidth: '400px',
    margin: '20px auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
  };

  const rewards = [
    { amount: '$100', reward: 'Free Gift', icon: '🎁' },
    { amount: '$200', reward: '20% off', icon: '💰' },
    { amount: '$300', reward: 'Free Shipping', icon: '🚚' }
  ];

  return (
    <div style={cardStyle}>
      <div style={{textAlign: 'center', marginBottom: '24px'}}>
        <h2 style={{margin: '0 0 8px 0', color: '#2c2c2c', fontSize: '24px', fontWeight: '600'}}>
          Unlock Rewards
        </h2>
        <p style={{margin: '0', color: '#666', fontSize: '14px'}}>
          Spend more to earn exciting rewards!
        </p>
      </div>
      
      <div style={{marginBottom: '24px'}}>
        <div style={{
          background: '#e0e0e0',
          height: '8px',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '8px'
        }}>
          <div style={{
            background: 'linear-gradient(90deg, #4CAF50, #45a049)',
            height: '100%',
            borderRadius: '4px',
            width: '33%'
          }}></div>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#666'
        }}>
          <span>$0</span>
          <span>$100</span>
          <span>$200</span>
          <span>$300</span>
        </div>
      </div>

      <div style={{marginBottom: '20px'}}>
        {rewards.map((reward, index) => (
          <div key={index} style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px',
            marginBottom: '12px',
            border: index === 0 ? '2px solid #4CAF50' : '2px solid #e0e0e0',
            borderRadius: '8px',
            background: index === 0 ? '#f0f8f0' : '#fafafa',
            boxShadow: index === 0 ? '0 2px 8px rgba(76, 175, 80, 0.1)' : 'none',
            position: 'relative'
          }}>
            <div style={{fontSize: '24px', marginRight: '16px', width: '40px', textAlign: 'center'}}>
              {reward.icon}
            </div>
            <div style={{flex: 1}}>
              <div style={{fontSize: '14px', color: '#666', marginBottom: '4px'}}>
                Spend {reward.amount} get
              </div>
              <div style={{fontSize: '18px', fontWeight: '600', color: '#2c2c2c'}}>
                {reward.reward}
              </div>
            </div>
            {index === 0 && (
              <div style={{
                background: '#4CAF50',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                Next
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{
        textAlign: 'center',
        padding: '16px',
        background: '#f8f9fa',
        borderRadius: '8px',
        borderLeft: '4px solid #4CAF50'
      }}>
        <p style={{margin: '4px 0', color: '#2c2c2c'}}>
          You've spent <strong style={{color: '#4CAF50'}}>$50</strong> so far
        </p>
        <p style={{margin: '4px 0', color: '#2c2c2c'}}>
          Spend <strong style={{color: '#4CAF50'}}>$50 more</strong> to unlock your first reward!
        </p>
      </div>
    </div>
  );
};

export default RewardsCard;