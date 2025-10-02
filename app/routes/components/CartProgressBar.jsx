import React, { useState, useEffect } from 'react';

const CartProgressBar = ({
  offers = [],
  cartValue = 0,
  itemCount = 0,
  placement = "cart",
  style = {
    primaryColor: "#4CAF50",
    backgroundColor: "#F5F5F5",
    goalCompleteColor: "#FF9800",
    cornerRadius: "square",
    thickness: "thin"
  }
}) => {
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get offer icon based on reward type
  const getOfferIcon = (offer) => {
    if (offer.rewardType === 'discount') {
      return (
        <span className="text-xs font-bold">
          {offer.discountCode}{offer.discountType === 'percentage' ? '%' : '$'}
        </span>
      );
    }
    if (offer.rewardType === 'shipping') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
      );
    }
    if (offer.rewardType === 'gift') {
      return '🎁';
    }
    if (offer.rewardType === 'product') {
      return '📦';
    }
    return '⭐';
  };

  // Sort offers by goal value
  const sortedOffers = offers.sort((a, b) => {
    const goalA = a.goalType === 'quantity' ? parseFloat(a.goalquantity || 0) : parseFloat(a.goalAmount || 0);
    const goalB = b.goalType === 'quantity' ? parseFloat(b.goalquantity || 0) : parseFloat(b.goalAmount || 0);
    return goalA - goalB;
  });

  // Calculate progress percentage
  const calculateProgress = () => {
    if (offers.length === 0) return 0;

    let progress = 0;
    const totalSteps = offers.length;

    for (let i = 0; i < sortedOffers.length; i++) {
      const offer = sortedOffers[i];
      const isQuantity = offer.goalType === 'quantity';
      const goal = isQuantity ? parseFloat(offer.goalquantity || 0) : parseFloat(offer.goalAmount || 0);
      const current = isQuantity ? itemCount : cartValue;

      if (current >= goal) {
        progress = ((i + 1) / totalSteps) * 100;
      } else {
        const ratio = Math.min(current / goal, 1);
        progress = ((i + ratio) / totalSteps) * 100;
        break;
      }
    }
    return Math.min(progress, 100);
  };

  // Get dynamic text based on current progress
  const getDynamicText = () => {
    if (sortedOffers.length === 0) return "No offers available";

    // Find the current active offer (first incomplete offer)
    const activeOffer = sortedOffers.find(offer => {
      const isQuantity = offer.goalType === 'quantity';
      const goal = isQuantity ? parseFloat(offer.goalquantity || 0) : parseFloat(offer.goalAmount || 0);
      const current = isQuantity ? itemCount : cartValue;
      return current < goal;
    });

    // If all offers are completed
    if (!activeOffer) {
      const lastOffer = sortedOffers[sortedOffers.length - 1];
      const rewardDescription = lastOffer.rewardType === "discount"
        ? `${lastOffer.discountCode}${lastOffer.discountType === "percentage" ? "%" : "$"} Discount`
        : lastOffer.rewardType === "shipping"
          ? "Free Shipping"
          : "Free Gift";

      return lastOffer.rewardType === "gift"
        ? "🎉 All rewards unlocked! Choose your free gifts!"
        : `🎉 All rewards unlocked! You've got ${rewardDescription}!`;
    }

    // Show current active offer
    const isQuantity = activeOffer.goalType === 'quantity';
    const goal = isQuantity ? parseFloat(activeOffer.goalquantity || 0) : parseFloat(activeOffer.goalAmount || 0);
    const current = isQuantity ? itemCount : cartValue;
    const amountLeft = Math.max(0, goal - current);

    const rewardDescription = activeOffer.rewardType === "discount"
      ? `${activeOffer.discountCode}${activeOffer.discountType === "percentage" ? "%" : "$"} Discount`
      : activeOffer.rewardType === "shipping"
        ? "Free Shipping"
        : "Free Gift";

    const unit = isQuantity ? "item" : "$";
    return `Add ${unit === "$" ? "$" : ""}${amountLeft}${unit === "item" ? " more item" + (amountLeft !== 1 ? "s" : "") : ""} to unlock ${rewardDescription}`;
  };

  // Calculate milestone position
  const getMilestonePosition = (index) => {
    if (sortedOffers.length === 1) return 50;
    if (index === 0) return 8;
    if (index === sortedOffers.length - 1) return 100;
    return 8 + ((index / (sortedOffers.length - 1)) * 92);
  };

  // Check if offer is completed
  const isOfferCompleted = (offer) => {
    const isQuantity = offer.goalType === 'quantity';
    const goal = isQuantity ? parseFloat(offer.goalquantity || 0) : parseFloat(offer.goalAmount || 0);
    const current = isQuantity ? itemCount : cartValue;
    return current >= goal;
  };

  const progress = calculateProgress();
  const borderRadius = style.cornerRadius === "square" ? "0px" : style.cornerRadius === "slightly" ? "4px" : "20px";
  const barHeight = style.thickness === "thin" ? "8px" : "12px";

  return (
    <div className={`cart-progress-bar ${placement}`}>
      {/* Dynamic Text */}
      <div className="mb-4 text-center">
        <div className="text-sm font-medium text-gray-700 px-4">
          {getDynamicText()}
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="relative w-full mb-6">
        {/* Background Progress Line */}
        <div
          className="w-full relative"
          style={{
            backgroundColor: style.backgroundColor,
            borderRadius: borderRadius,
            height: barHeight,
            marginTop: style.thickness === "thin" ? "20px" : "18px"
          }}
        >
          {/* Progress Fill */}
          <div
            className="transition-all duration-500 ease-in-out"
            style={{
              backgroundColor: style.primaryColor,
              borderRadius: borderRadius,
              height: barHeight,
              width: `${progress}%`,
              position: 'absolute',
              left: 0,
              top: 0
            }}
          />
        </div>

        {/* Milestones */}
        <div className={`${isMobile ? 'flex flex-col space-y-4' : 'absolute top-0 w-full'}`}>
          {sortedOffers.map((offer, index) => {
            const isCompleted = isOfferCompleted(offer);
            const position = getMilestonePosition(index);
            const goal = offer.goalType === 'quantity' ? offer.goalquantity : offer.goalAmount;

            return (
              <div key={offer.id} className={`${isMobile ? 'flex items-center space-x-3' : 'absolute'}`}>
                {/* Milestone Circle */}
                <div
                  className={`
                    ${isMobile ? 'flex-shrink-0' : 'absolute'}
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shadow-md transition-all duration-300
                    ${isCompleted ? 'scale-110' : 'scale-100'}
                  `}
                  style={{
                    backgroundColor: isCompleted ? style.goalCompleteColor : "#ddd",
                    color: isCompleted ? "#fff" : "#000",
                    left: isMobile ? 'auto' : `${position}%`,
                    transform: isMobile ? 'none' : 'translateX(-50%)',
                    zIndex: 3
                  }}
                >
                  {getOfferIcon(offer)}
                </div>

                {/* Milestone Info */}
                <div className={`${isMobile ? 'flex-1' : 'absolute'} ${isMobile ? '' : 'top-12'} ${isMobile ? '' : 'left-1/2'} ${isMobile ? '' : 'transform -translate-x-1/2'}`}>
                  {/* Goal Label */}
                  <div className="text-xs text-gray-600 text-center mb-1">
                    {offer.goalType === 'quantity' ? `${goal} items` : `$${goal}`}
                  </div>

                  {/* Goal Text */}
                  <div className="text-xs text-gray-500 text-center max-w-24 leading-tight">
                    {isCompleted
                      ? (offer.goalTextAfter || 'Unlocked!')
                      : (offer.goalTextBefore || 'Unlock!')
                    }
                  </div>

                  {/* Reward Products */}
                  {isCompleted && (offer.rewardType === 'gift' || offer.rewardType === 'product') && offer.rewardProducts && offer.rewardProducts.length > 0 && (
                    <div className={`mt-2 ${isMobile ? 'flex space-x-2' : 'flex flex-col space-y-1'}`}>
                      {offer.rewardProducts.slice(0, isMobile ? 3 : 2).map((product, prodIndex) => (
                        <div
                          key={prodIndex}
                          className={`
                            ${isMobile ? 'flex-shrink-0' : ''}
                            bg-white border border-gray-200 rounded-lg p-2 shadow-sm
                            ${isMobile ? 'w-20' : 'w-16'}
                          `}
                        >
                          <img
                            src={product.media || 'https://via.placeholder.com/40'}
                            alt={product.title}
                            className={`${isMobile ? 'w-12 h-12' : 'w-8 h-8'} rounded object-cover mb-1`}
                          />
                          <div className="text-xs font-medium text-gray-700 truncate mb-1">
                            {product.title}
                          </div>
                          <button
                            onClick={() => {
                              // Preview functionality
                              alert(`Preview: Would add "${product.title}" to cart`);
                            }}
                            className="w-full text-xs bg-green-500 text-white rounded px-2 py-1 hover:bg-green-600 transition-colors"
                          >
                            Add to Cart
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Summary */}
      <div className="text-xs text-gray-500 text-center space-x-4">
        <span>Cart: ${cartValue}</span>
        <span>Items: {itemCount}</span>
        <span>Progress: {Math.round(progress)}%</span>
      </div>
    </div>
  );
};

export default CartProgressBar;

