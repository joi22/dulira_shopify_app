import React from 'react';

const HomeCard = () => {
    const products = [
        {
            id: 1, title: 'New 925 sterling silver elegant Peacock opening screen bracelet', price: '$29.99', img: 'https://ae-pic-a1.aliexpress-media.com/kf/S9bf0b37826d84a5fba2896cda2eb1a75Q.jpg_480x480q75.jpg_.avif', sold: '1000+ sold' },
        {
            id: 2, title: 'New 925 sterling silver elegant Peacock opening screen bracelet', price: '$39.99', img: 'https://ae-pic-a1.aliexpress-media.com/kf/Sd433bc8794e64628b6cc744c154067a3f.jpg_480x480q75.jpg_.avif', sold : '1000+ sold' },
    ];

    return (
    <>
           

            <div
                style={{
                    marginTop: '30px',
                    gap: '20px',
                    maxWidth: '400px',
                    margin: '0 auto',
                    background: '#fff',
                    padding: '20px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                }}
            >
                 <h2 style={{ marginBottom: '30px', fontSize: '2rem', color: '#333', textAlign: 'center', }}>Bundle Deals</h2> 
                <div
                style={{
                    justifyContent : 'space-between',
                    display : 'flex',
                        gap: '20px',
                }}>
                {products.map((product) => (
                    
                    <div
                        key={product.id}
                        style={{
                            flex: '1',
                           
                        }}
                    >
                        <img
                            src={product.img}
                            alt={product.title}
                            style={{ width: '100%',}}
                        />
                        <h3 style={{ margin: '10px 0 5px' }}>{product.title}</h3>
                        <p style={{ fontWeight: 'bold', color: '#e91e63' }}>{product.price}</p>
                        <p style={{ fontWeight: 'bold' }}>{product.sold}</p>
                    </div>
                ))}
                </div>
            </div>
        </>
    );
};

export default HomeCard;
