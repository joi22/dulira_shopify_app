# CartProgressBar Component

A responsive React component that creates a Monster Cart-style progress bar with milestones, dynamic text, and reward product displays.

## Features

✅ **Multi-tier Progress Bar**: Supports multiple offers sorted by goal value  
✅ **Dynamic Text**: Shows contextual messages based on current progress  
✅ **Responsive Design**: Adapts to desktop and mobile layouts  
✅ **Reward Products**: Displays product thumbnails with "Add to Cart" buttons  
✅ **Smooth Animations**: CSS transitions for progress fill and milestone scaling  
✅ **Customizable Styling**: Full control over colors, radius, and thickness  
✅ **Shopify Compatible**: Works in Polaris/Remix environment  

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `offers` | `Array` | `[]` | Array of offer objects |
| `cartValue` | `number` | `0` | Current cart total ($) |
| `itemCount` | `number` | `0` | Current cart item count |
| `placement` | `string` | `"cart"` | Placement context ("home" \| "product" \| "cart") |
| `style` | `object` | `{...}` | Styling configuration |

## Offer Object Structure

```javascript
{
  id: number,                    // Unique identifier
  goalType: string,              // "amount_cart" or "quantity"
  goalAmount: number,            // Dollar amount goal (if amount_cart)
  goalquantity: number,          // Item count goal (if quantity)
  rewardType: string,            // "discount" | "shipping" | "gift" | "product"
  discountCode: number,          // Discount value (if discount)
  discountType: string,          // "percentage" or "amount" (if discount)
  goalTextBefore: string,        // Text shown before goal reached
  goalTextAfter: string,         // Text shown after goal reached
  rewardProducts: Array          // Array of reward product objects
}
```

## Reward Product Object Structure

```javascript
{
  id: number,                   // Unique identifier
  title: string,                // Product title
  media: string                  // Product image URL
}
```

## Style Object Structure

```javascript
{
  primaryColor: string,          // Progress bar fill color
  backgroundColor: string,        // Progress bar background color
  goalCompleteColor: string,     // Completed milestone color
  cornerRadius: string,          // "square" | "slightly" | "rounded"
  thickness: string              // "thin" | "thick"
}
```

## Usage Examples

### Basic Usage

```jsx
import CartProgressBar from './components/CartProgressBar';

const offers = [
  {
    id: 1,
    goalType: "amount_cart",
    goalAmount: 50,
    rewardType: "discount",
    discountCode: 10,
    discountType: "percentage",
    goalTextBefore: "Add more to unlock discount!",
    goalTextAfter: "Discount unlocked!"
  }
];

<CartProgressBar
  offers={offers}
  cartValue={25}
  itemCount={1}
  placement="cart"
/>
```

### Advanced Usage with Custom Styling

```jsx
<CartProgressBar
  offers={offers}
  cartValue={75}
  itemCount={3}
  placement="product"
  style={{
    primaryColor: "#FF6B6B",
    backgroundColor: "#F8F9FA",
    goalCompleteColor: "#4ECDC4",
    cornerRadius: "rounded",
    thickness: "thick"
  }}
/>
```

### Multiple Offers with Gift Products

```jsx
const offers = [
  {
    id: 1,
    goalType: "amount_cart",
    goalAmount: 50,
    rewardType: "discount",
    discountCode: 10,
    discountType: "percentage"
  },
  {
    id: 2,
    goalType: "quantity",
    goalquantity: 3,
    rewardType: "gift",
    rewardProducts: [
      {
        id: 1,
        title: "Free T-Shirt",
        media: "https://example.com/tshirt.jpg"
      },
      {
        id: 2,
        title: "Free Mug",
        media: "https://example.com/mug.jpg"
      }
    ]
  }
];
```

## Responsive Behavior

### Desktop (≥768px)
- Milestones spread evenly across progress bar
- Labels positioned below milestones
- Reward products displayed in horizontal layout

### Mobile (<768px)
- Milestones stack vertically
- Labels positioned to the right of milestones
- Reward products displayed in compact horizontal scroll

## Dynamic Text Logic

The component automatically displays contextual text based on current progress:

1. **Goal Not Reached**: "Add $X more to unlock [Reward]"
2. **Goal Reached**: "🎉 Reward unlocked: [Reward]"
3. **All Goals Reached**: "🎉 All rewards unlocked!"

## Milestone Icons

Icons are automatically selected based on reward type:
- **Discount**: Shows discount percentage/amount
- **Shipping**: Truck icon (SVG)
- **Gift**: 🎁 emoji
- **Product**: 📦 emoji
- **Default**: ⭐ emoji

## Animation Features

- **Progress Fill**: Smooth CSS transition (500ms ease-in-out)
- **Milestone Scaling**: Completed milestones scale to 110%
- **Hover Effects**: Reward product buttons have hover states

## Browser Support

- Modern browsers with CSS Grid/Flexbox support
- Mobile responsive (iOS Safari, Chrome Mobile)
- Shopify Polaris compatibility

## Demo

Visit `/app/cart-progress-demo` to see the component in action with interactive controls and test scenarios.

## Dependencies

- React 16.8+ (hooks)
- Tailwind CSS (for styling)
- No external UI library dependencies

