import { useState } from "react";
import { Button } from "@shopify/polaris";
export default function CardsPopup() {
  const [open, setOpen] = useState(false);



  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "12px 28px",
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Show Cards
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            marginTop: "-80px",
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#F1F1F1",
            //   borderRadius: "18px",
              padding: "80px",
              width: "100%",
              height: "100%",
            //   maxWidth: "850px",
              position: "relative",
              boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
            }}
          >
            {/* Close Button */}
{/* Header with arrow and title */}
<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "10px", // Arrow aur heading ke beech gap
    marginBottom: "",
  }}
>
  <button
    onClick={() => setOpen(false)}
    style={{
      background: "transparent",
      border: "none",
      fontSize: "26px",
      color: "#000",
      marginTop: "-4px", // Arrow ko thoda upar align karne ke liye
      cursor: "pointer",
    }}
    title="Back"
  >
    ←
  </button>

  <h2
    style={{
      marginTop:"-20px",
      fontSize: "22px",
      fontWeight: 600,
      color: "#333",
      margin: 0, // Flex me extra margin avoid karne ke liye
    }}
  >
    Select bundle type
  </h2>
</div>


            {/* Cards grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)", // 👈 exactly 3 cards per row
                gap: "5px",
                // padding:"10px",
              }}
            >

<div
  style={{
    background: "#fff",
    border: "1px solid #e4e4e4",
    borderRadius: "14px",
    padding: "18px 16px 14px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "210px",
    width: "340px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    alignItems: "center",
  }}
>
  {/* Top image section - static */}
  <div
    style={{
      position: "relative",
      marginTop: "40px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "8px",
      height: "60px",
      width: "60%",
      border: "1px solid #ccc",
      borderRadius: "12px",
      background: "rgba(0,0,0,0.05)",
    }}
  >
                  
    {/* Text inside border */}
    <span
      style={{
        position: "absolute",
        top: "-10px",
        background: "#fff",
        padding: "0 8px",
        left: "10%",
        fontSize: "12px",
        color: "#333",
        fontWeight: "500",
      }}
    >
      Buy all
    </span>
    <span
      style={{
        position: "absolute",
        top: "-10px",
        background: "#fff",
        padding: "0 10px",
        right: "10%",
        fontSize: "12px",
        color: "#333",
        fontWeight: "500",
      }}
    >
      Save <span
      style={{
        color : "#FF0000",
      }}> 20% </span>
    </span>
    
    {/* Four static image divs */}
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "8px",
        width: "100%",
        marginTop: "8px",
      }}
    >
      <div style={{
        width: "40px", height: "40px", borderRadius: "8px",
        background: "transparent", border: "1px dashed #ccc",
        display: "flex", justifyContent: "center", alignItems: "center"
      }}>
                      <img
                        src="https://cdn-icons-png.flaticon.com/512/4804/4804045.png"
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                        }}
                      />      </div>
      <div style={{
        width: "40px", height: "40px", borderRadius: "8px",
        background: "transparent", border: "1px dashed #ccc",
        display: "flex", justifyContent: "center", alignItems: "center"
      }}>
                      <img
                        src="https://cdn-icons-png.flaticon.com/512/750/750453.png"
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                        }}
                      /> 
      </div>
      <div style={{
        width: "40px", height: "40px", borderRadius: "8px",
        background: "transparent", border: "1px dashed #ccc",
        display: "flex", justifyContent: "center", alignItems: "center"
      }}>
                      <img
                        src="https://cdn-icons-png.flaticon.com/512/2161/2161173.png"
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                        }}
                      />
      </div>
      <div style={{
        width: "40px", height: "40px", borderRadius: "8px",
        background: "transparent", border: "1px dashed #ccc",
        display: "flex", justifyContent: "center", alignItems: "center"
      }}>
                      <img
                        src="https://www.freeiconspng.com/uploads/shoe-icon-14.png"
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                        }}
                      />
      </div>
    </div>
  </div>

  {/* Card title - static (button ke just upar left side) */}
  <div style={{ 
    textAlign: "left", 
    marginBottom: "12px", 
    width: "100%",
    marginTop: "auto", // Ye button ke upar lane ke liye
  }}>
    <h3
      style={{
        fontSize: "15px",
        fontWeight: 600,
        color: "#333",
        margin: 0,
        paddingLeft: "8px",
      }}
    >
      Fixed bundle
    </h3>
    
  </div>

  {/* Select button - static */}
<Button fullWidth tone="success" variant="secondary">
  Select
</Button>
</div>


<div
  style={{
    background: "#fff",
    border: "1px solid #e4e4e4",
    borderRadius: "14px",
    padding: "18px 16px 14px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "210px",
    width: "340px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    alignItems: "center",
  }}
>
  {/* Top image section - static */}
<div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    marginTop: "40px",
  }}
>
  <div
    style={{
      position: "relative",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "8px",
      height: "60px",
      width: "30%",
      border: "1px solid #ccc",
      borderRadius: "12px",
      background: "rgba(0,0,0,0.05)",
    }}
  >
    {/* Text inside border */}
    <span
      style={{
        position: "absolute",
        top: "-10px",
        background: "#fff",
        padding: "0 8px",
        left: "10%",
        fontSize: "12px",
        color: "#333",
        fontWeight: "500",
      }}
    >
      Save <span
      style={{
        color : "#FF0000",
      }}> <span
      style={{
        color : "#FF0000",
      }}> 20% </span> </span>
    </span>
    
    {/* Two static image divs */}
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "8px",
        width: "100%",
        marginTop: "8px",
      }}
    >
      <div style={{
        width: "60px", height: "40px", borderRadius: "8px",
        background: "transparent", border: "1px dashed #ccc",
        display: "flex", justifyContent: "center", alignItems: "center"
      }}></div>
      <div style={{
        width: "90px", height: "40px", borderRadius: "8px",
        background: "transparent", border: "1px dashed #ccc",
        display: "flex", justifyContent: "center", alignItems: "center"
      }}>
                        <img
                          src="https://cdn-icons-png.flaticon.com/512/4804/4804045.png"
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                          }}
                        />
      </div>
    </div>
  </div>

  <div
    style={{
      position: "relative",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "8px",
      height: "60px",
      width: "30%",
      border: "1px solid #ccc",
      borderRadius: "12px",
      background: "rgba(0,0,0,0.05)",
    }}
  >
    {/* Text inside border */}
    <span
      style={{
        position: "absolute",
        top: "-10px",
        background: "#fff",
        padding: "0 8px",
        left: "10%",
        fontSize: "12px",
        color: "#333",
        fontWeight: "500",
      }}
    >
      Save <span
      style={{
        color : "#FF0000",
      }}> 10% </span>
    </span>
    
    {/* Two static image divs */}
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "8px",
        width: "100%",
        marginTop: "8px",
      }}
    >
      <div style={{
        width: "40px", height: "40px", borderRadius: "8px",
        background: "transparent", border: "1px dashed #ccc",
        display: "flex", justifyContent: "center", alignItems: "center"
      }}></div>
      <div style={{
        width: "60px", height: "40px", borderRadius: "8px",
        background: "transparent", border: "1px dashed #ccc",
        display: "flex", justifyContent: "center", alignItems: "center"
      }}>
                        <img
                          src="https://cdn-icons-png.flaticon.com/512/4804/4804045.png"
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                          }}
                        />
      </div>
    </div>
  </div>
</div>

  {/* Card title - static (button ke just upar left side) */}
  <div style={{ 
    textAlign: "left", 
    marginBottom: "12px", 
    width: "100%",
    marginTop: "40px", // Ye button ke upar lane ke liye
  }}>
    <h3
      style={{
        fontSize: "15px",
        fontWeight: 600,
        color: "#333",
        margin: 0,
        paddingLeft: "8px",
      }}
    >
      Volume discounts
    </h3>
  </div> 
  {/* Select button - static */}
<Button fullWidth tone="success" variant="secondary">
  Select
</Button>
</div>

<div
  style={{
    background: "#fff",
    border: "1px solid #e4e4e4",
    borderRadius: "14px",
    padding: "18px 16px 14px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "210px",
    width: "340px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    alignItems: "center",
  }}
>
  {/* Top image section - static */}
<div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    marginTop: "40px",
  }}
>
  <div
    style={{
      position: "relative",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "8px",
      height: "60px",
      width: "30%",
      border: "1px solid #ccc",
      borderRadius: "12px",
      background: "rgba(0,0,0,0.05)",
    }}
  >
    {/* Text inside border */}
    <span
      style={{  
        position: "absolute",
        top: "-10px",
        background: "#fff",
        padding: "0 8px",
        left: "10%",
        fontSize: "12px",
        color: "#333",
        fontWeight: "500",
      }}
    >
      Buy X
    </span>
    
    {/* Two static image divs */}
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "8px",
        width: "100%",
      }}
    >
      <div style={{
        width: "90px", height: "40px", borderRadius: "8px", marginTop: "8px",
        background: "transparent", border: "1px dashed #ccc",
        display: "flex", justifyContent: "center", alignItems: "center"
      }}>
                        <img
                          src="https://www.freeiconspng.com/uploads/shoe-icon-14.png"
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                          }}
                        />
      </div>
    </div>
  </div>

  <div
    style={{
      position: "relative",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "8px",
      height: "60px",
      width: "30%",
      border: "1px solid #ccc",
      borderRadius: "12px",
      background: "rgba(0,0,0,0.05)",
    }}
  >
    {/* Text inside border */}
    <span
      style={{
        position: "absolute",
        top: "-10px",
        background: "#fff",
        padding: "0 8px",
        left: "10%",
        fontSize: "12px",
        color: "#333",
        fontWeight: "500",
      }}
    >
      Get Y
    </span>
    
    {/* Two static image divs */}
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "8px",
        width: "100%",
      }}
    >
      <div style={{
        width: "60px", height: "40px", borderRadius: "8px",marginTop: "8px",
        background: "transparent", border: "1px dashed #ccc",
        display: "flex", justifyContent: "center", alignItems: "center"
      }}>
                        <img
                          src="https://cdn-icons-png.flaticon.com/512/2161/2161173.png"
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                          }}
                        />
      </div>
    </div>
  </div>
</div>


  {/* Card title - static (button ke just upar left side) */}
  <div style={{ 
    textAlign: "left", 
    marginBottom: "12px", 
    width: "100%",
    marginTop: "auto", // Ye button ke upar lane ke liye
  }}>
    <h3
      style={{
        fontSize: "15px",
        fontWeight: 600,
        color: "#333",
        margin: 0,
        paddingLeft: "8px",
      }}
    >
      Buy X Get Y
    </h3>
  </div>

  {/* Select button - static */}
<Button fullWidth tone="success" variant="secondary">
  Select
</Button>
</div>

<div
  style={{
    background: "#fff",
    border: "1px solid #e4e4e4",
    borderRadius: "14px",
    padding: "18px 16px 14px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "210px",
    width: "340px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    alignItems: "center",
  }}
>
  {/* Top image section - static */}
  <div
    style={{
      position: "relative",
      marginTop: "15px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "8px",
      height: "120px",
      width: "80%",
      border: "1px solid #ccc",
      borderRadius: "12px",
      background: "rgba(0,0,0,0.05)",
    }}
  >
    {/* Text inside border */}
    <span
      style={{
        position: "absolute",
        top: "-10px",
        background: "#fff",
        padding: "0 8px",
        left: "10%",
        fontSize: "12px",
        color: "#333",
        fontWeight: "500",
      }}
    >
      Buy 1-3
    </span>
    <span
      style={{
        position: "absolute",
        top: "-10px",
        background: "#fff",
        padding: "0 10px",
        right: "10%",
        fontSize: "12px",
        color: "#333",
        fontWeight: "500",
      }}
    >
      Save <span
      style={{
        color : "#FF0000",
      }}> 20% </span>
    </span>
    
    {/* Four static image divs */}
<div
  style={{
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    marginTop: "8px",
  }}
>
  {/* First row - 5 images */}
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "8px",
      width: "100%",
    }}
  >
    <div style={{
      width: "40px", height: "40px", borderRadius: "8px",
      background: "transparent", border: "1px dashed #ccc",
      display: "flex", justifyContent: "center", alignItems: "center"
    }}>
                        <img
                          src="https://cdn-icons-png.flaticon.com/512/4804/4804045.png"
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                          }}
                        /> 
    </div>
    <div style={{
      width: "40px", height: "40px", borderRadius: "8px",
      background: "transparent", border: "1px dashed #ccc",
      display: "flex", justifyContent: "center", alignItems: "center"
    }}>
                        <img
                          src="https://cdn-icons-png.flaticon.com/512/750/750453.png"
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                          }}
                        /> 
    </div>
    <div style={{
      width: "40px", height: "40px", borderRadius: "8px",
      background: "transparent", border: "1px dashed #ccc",
      display: "flex", justifyContent: "center", alignItems: "center"
    }}>
                        <img
                          src="https://cdn-icons-png.flaticon.com/512/4804/4804045.png"
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                          }}
                        /> 
    </div>
    <div style={{
      width: "40px", height: "40px", borderRadius: "8px",
      background: "transparent", border: "1px dashed #ccc",
      display: "flex", justifyContent: "center", alignItems: "center"
    }}>
                        <img
                          src="https://cdn-icons-png.flaticon.com/512/2161/2161173.png"
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                          }}
                        />
    </div>
    <div style={{
      width: "40px", height: "40px", borderRadius: "8px",
      background: "transparent", border: "1px dashed #ccc",
      display: "flex", justifyContent: "center", alignItems: "center"
    }}>
                        <img
                          src="https://www.freeiconspng.com/uploads/shoe-icon-14.png"
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                          }}
                        />
    </div>
  </div>

  {/* Second row - 5 images */}
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "8px",
      width: "100%",
    }}
  >
    <div style={{
      width: "40px", height: "40px", borderRadius: "8px",
      background: "transparent", border: "1px dashed #ccc",
      display: "flex", justifyContent: "center", alignItems: "center"
    }}>
                        <img
                          src="https://cdn-icons-png.flaticon.com/512/4804/4804045.png"
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                          }}
                        /> 
    </div>
    <div style={{
      width: "40px", height: "40px", borderRadius: "8px",
      background: "transparent", border: "1px dashed #ccc",
      display: "flex", justifyContent: "center", alignItems: "center"
                      }}>
                        <img
                          src="https://cdn-icons-png.flaticon.com/512/884/884432.png"
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                          }}
                        /> 
    </div>
    <div style={{
      width: "40px", height: "40px", borderRadius: "8px",
      background: "transparent", border: "1px dashed #ccc",
      display: "flex", justifyContent: "center", alignItems: "center"
    }}>
                        <img
                          src="https://www.freeiconspng.com/uploads/shoe-icon-14.png"
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                          }}
                        />
    </div>
    <div style={{
      width: "40px", height: "40px", borderRadius: "8px",
      background: "transparent", border: "1px dashed #ccc",
      display: "flex", justifyContent: "center", alignItems: "center"
    }}>
                        <img
                          src="https://cdn-icons-png.flaticon.com/512/750/750453.png"
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                          }}
                        /> 
    </div>
    <div style={{
      width: "40px", height: "40px", borderRadius: "8px",
      background: "transparent", border: "1px dashed #ccc",
      display: "flex", justifyContent: "center", alignItems: "center"
    }}>
                        <img
                          src="https://cdn-icons-png.flaticon.com/512/4804/4804045.png"
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                          }}
                        /> 
    </div>
  </div>
</div>
  </div>

  {/* Card title - static (button ke just upar left side) */}
  <div style={{ 
    textAlign: "left", 
    marginBottom: "12px", 
    width: "100%",
    marginTop: "auto", // Ye button ke upar lane ke liye
  }}>
    <h3
      style={{
        fontSize: "15px",
        fontWeight: 600,
        color: "#333",
        margin: 0,
        paddingLeft: "8px",
      }}
    >
      Mix and Match
    </h3>
  </div>

  {/* Select button - static */}
<Button fullWidth tone="success" variant="secondary">
  Select
</Button>
</div>

<div
  style={{
    background: "#fff",
    border: "1px solid #e4e4e4",
    borderRadius: "14px",
    padding: "18px 16px 14px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "210px",
    width: "340px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    alignItems: "center",
  }}
>
  {/* Top image section - static */}
<div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    marginTop: "40px",
  }}
>

    {/* Text inside border */}
    
    {/* Two static image divs */}

      <div style={{
        width: "80px", height: "80px", borderRadius: "8px",
        background: "transparent", border: "1px dashed #ccc",
        display: "flex", justifyContent: "center", alignItems: "center"
      }}>
                    <img
                      src="https://www.clipartmax.com/png/middle/217-2174235_jacket-clipart-lady-jacket-coat-icon.png"
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                      }}
                    />
      </div>
  

  <div
    style={{
      position: "relative",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "8px",
      height: "60px",
      width: "50%",
      border: "1px solid #ccc",
      borderRadius: "12px",
      background: "rgba(0,0,0,0.05)",
    }}
  >
    {/* Text inside border */}
    <span
      style={{
        position: "absolute",
        top: "-10px",
        background: "#fff",
        padding: "0 8px",
        left: "10%",
        fontSize: "12px",
        color: "#333",
        fontWeight: "500",
      }}
    >
      Save <span
      style={{
        color : "#FF0000",
      }}> 10% </span>
    </span>
    
    {/* Two static image divs */}
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "8px",
        width: "100%",
        marginTop: "8px",
      }}
    >
      <div style={{
        width: "60px", height: "40px", borderRadius: "8px",
        background: "transparent", border: "1px dashed #ccc",
        display: "flex", justifyContent: "center", alignItems: "center"
      }}>
                        <img
                          src="https://cdn-icons-png.flaticon.com/512/4804/4804045.png"
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                          }}
                        />
      </div>
      <div style={{
        width: "60px", height: "40px", borderRadius: "8px",
        background: "transparent", border: "1px dashed #ccc",
        display: "flex", justifyContent: "center", alignItems: "center"
      }}>
                        <img
                          src="                https://png.pngtree.com/png-clipart/20190630/original/pngtree-vector-tie-icon-png-image_4152651.jpg
"
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                          }}
                        />
      </div>
    </div>
  </div>
</div>
  {/* Card title - static (button ke just upar left side) */}
  <div style={{ 
    textAlign: "left", 
    marginBottom: "12px", 
    width: "100%",
    marginTop: "40px", // Ye button ke upar lane ke liye
  }}>
    <h3
      style={{
        fontSize: "15px",
        fontWeight: 600,
        color: "#333",
        margin: 0,
        paddingLeft: "8px",
      }}
    >
      Product and Ons
    </h3>
  </div>

  {/* Select button - static */}
<Button fullWidth tone="success" variant="secondary">
  Select
</Button>
</div>

<div
  style={{
    background: "#fff",
    border: "1px solid #e4e4e4",
    borderRadius: "14px",
    padding: "18px 16px 14px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "210px",
    width: "340px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    alignItems: "center",
  }}
>
  {/* Top image section - static */}
  <div
    style={{
      position: "relative",
      marginTop: "40px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "8px",
      height: "60px",
      width: "90%",
      border: "1px solid #ccc",
      borderRadius: "12px",
      background: "rgba(0,0,0,0.05)",
    }}
  >
    {/* Text inside border */}
    <span
      style={{
        position: "absolute",
        top: "-10px",
        background: "#fff",
        padding: "0 8px",
        left: "10%",
        fontSize: "9px",
        color: "#333",
        fontWeight: "500",
      }}
    >
      Frequently bought together
    </span>
    <span
      style={{
        position: "absolute",
        top: "-10px",
        background: "#fff",
        padding: "0 10px",
        right: "5%",
        fontSize: "9px",
        color: "#333",
        fontWeight: "500",
      }}
    >
      Save <span
      style={{
        color : "#FF0000",
      }}> 20% </span>
    </span>
    
    {/* Four static image divs */}
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "8px",
        width: "100%",
        marginTop: "8px",
      }}
    >
      <div style={{
        width: "60px", height: "40px", borderRadius: "8px",
        background: "transparent", border: "1px dashed #ccc",
        display: "flex", justifyContent: "center", alignItems: "center"
      }}>
                      <img
                        src="https://cdn-icons-png.flaticon.com/512/4804/4804045.png"
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                        }}
                      />
      </div>
             <div style={{
        width: "20px", height: "20px", borderRadius: "8px",
        display: "flex", justifyContent: "center", alignItems: "center"
      }}>+</div>
       <div style={{
        width: "60px", height: "40px", borderRadius: "8px",
        background: "transparent", border: "1px dashed #ccc",
        display: "flex", justifyContent: "center", alignItems: "center"
      }}>
                      <img
                        src="https://cdn-icons-png.flaticon.com/512/750/750453.png"
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                        }}
                      /> 
      </div>
       <div style={{
        width: "60px", height: "40px", borderRadius: "8px",
        background: "transparent", border: "1px dashed #ccc",
        display: "flex", justifyContent: "center", alignItems: "center"
      }}>
                      <img
                        src="                      https://t4.ftcdn.net/jpg/14/29/19/97/360_F_1429199783_o6yIzsOgX5pEySbahEigmcUKKBGTyIrt.jpg
"
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                        }}
                      /> 
      </div>
      <div style={{
        width: "60px", height: "40px", borderRadius: "8px",
        background: "transparent", border: "1px dashed #ccc",
        display: "flex", justifyContent: "center", alignItems: "center"
      }}>
                      <img
                        src="https://cdn-icons-png.flaticon.com/512/2161/2161173.png"
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                        }}
                      />
      </div>
      <div style={{
        width: "60px", height: "40px", borderRadius: "8px",
        background: "transparent", border: "1px dashed #ccc",
        display: "flex", justifyContent: "center", alignItems: "center"
      }}>
                      <img
                        src="https://cdn-icons-png.flaticon.com/512/4804/4804045.png"
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                        }}
                      />
      </div>
      <div style={{
        width: "60px", height: "40px", borderRadius: "8px",
        background: "transparent", border: "1px dashed #ccc",
        display: "flex", justifyContent: "center", alignItems: "center"
      }}>
                      <img
                        src="https://www.freeiconspng.com/uploads/shoe-icon-14.png"
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover", // 👈 image div ko fill kare, shape maintain rakhe
                        }}
                      />
      </div>
    </div>
  </div>

  {/* Card title - static (button ke just upar left side) */}
  <div style={{ 
    textAlign: "left", 
    marginBottom: "12px", 
    width: "100%",
    marginTop: "auto", // Ye button ke upar lane ke liye
  }}>
    <h3
      style={{
        fontSize: "15px",
        fontWeight: 600,
        color: "#333",
        margin: 0,
        paddingLeft: "8px",
      }}
    >
      Frequently bought together
    </h3>
  </div>

  {/* Select button - static */}
<Button fullWidth tone="success" variant="secondary">
  Select
</Button>
</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
