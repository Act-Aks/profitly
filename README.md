# Profitly - Trading P&L Tracker

A modern mobile app for tracking trading profit and loss with beautiful UI animations and comprehensive analytics. Built with React Native, Expo, and the latest tech stack.

## ✨ Features

### 📊 **Comprehensive Analytics**
- Real-time P&L tracking
- Win rate calculations
- Profit factor analysis
- Drawdown monitoring
- Performance metrics

### 📱 **Modern UI/UX**
- Beautiful animations with React Native Reanimated
- Dark/Light mode support
- Smooth transitions and gestures
- Intuitive navigation

### 💾 **Local Data Storage**
- All data stored locally with SQLite
- Complete privacy - no cloud dependency
- Fast offline access
- Secure data persistence with MMKV

### 📈 **Trade Management**
- Manual trade entry
- CSV import functionality
- Trade editing and deletion
- Position tracking (open/closed/cancelled)
- Notes and tags support

### 📊 **Charts & Visualizations**
- Cumulative P&L curves
- Performance charts with Victory Native
- Interactive data visualization
- Historical analysis

## 🛠 Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **UI Library**: HeroUI Native
- **Styling**: Tailwind CSS with Uniwind
- **Database**: SQLite with Drizzle ORM
- **State Management**: Zustand
- **Storage**: MMKV for persistence
- **Animations**: React Native Reanimated
- **Charts**: Victory Native
- **Forms**: React Hook Form with Zod validation
- **Language**: TypeScript

## 🚀 Getting Started

### Prerequisites

- Node.js 24+
- Bun 1.3.7+
- iOS Simulator or Android Emulator
- Expo CLI

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd profitly
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Generate database migrations**
   ```bash
   bun run db:generate
   ```

4. **Start the development server**
   ```bash
   bun run start
   ```

5. **Run on device/simulator**
   ```bash
   # iOS
   bun run ios
   
   # Android
   bun run android
   ```

## 📱 App Structure

### Onboarding Flow
- Welcome screen with feature highlights
- User profile setup
- First trading account creation
- Currency preference selection

### Main Features

#### Dashboard
- Account balance overview
- Quick P&L statistics
- Recent trades list
- Quick action buttons

#### Trades Management
- Add new trades manually
- View all trades with filtering
- Edit trade details
- Close open positions

#### Analytics
- Performance metrics
- Win rate analysis
- Profit factor calculations
- Time-based filtering
- Visual charts and graphs

#### Settings
- Profile management
- Account switching
- Data import/export
- App preferences

## 📊 Database Schema

The app uses a well-structured SQLite database with the following main tables:

- **Users**: Profile information and preferences
- **Accounts**: Trading accounts (demo, live, paper)
- **Trades**: Individual trade records
- **Sessions**: Trading session journals
- **Import Logs**: CSV import tracking

## 📁 Project Structure

```
src/
├── app/                    # Expo Router pages
│   ├── (onboarding)/      # Onboarding flow
│   ├── (tabs)/            # Main tab navigation
│   └── trade/             # Trade management
├── components/            # Reusable UI components
├── stores/               # Zustand state management
├── utils/                # Utilities and helpers
│   ├── database/         # Database schema and services
│   ├── calculations.ts   # Trading calculations
│   └── formatters.ts     # Data formatting
└── global.css           # Global styles
```

## 🔧 Development Scripts

```bash
# Development
bun run start              # Start Expo dev server
bun run start:dev         # Start with dev client
bun run ios               # Run on iOS simulator
bun run android           # Run on Android emulator

# Database
bun run db:generate       # Generate migrations
bun run db:migrate        # Run migrations
bun run db:studio         # Open Drizzle Studio

# Code Quality
bun run check             # Run linting
bun run fix               # Fix linting issues
```

## 📊 CSV Import Format

The app supports importing trades from CSV files with the following columns:

### Required Columns
- **Symbol/Instrument**: Trading symbol (e.g., AAPL, EURUSD)
- **Side/Action**: buy, sell, long, short
- **Quantity/Size**: Number of shares/units
- **Entry Price/Open Price**: Entry price

### Optional Columns
- **Exit Price/Close Price**: Exit price for closed trades
- **P&L/Profit**: Profit/loss amount
- **Commission/Fees**: Trading fees
- **Date/Time**: Trade timestamp

### Sample CSV
```csv
Symbol,Side,Quantity,Entry Price,Exit Price,P&L,Date
AAPL,buy,100,150.00,155.00,500.00,2024-01-15
TSLA,sell,50,800.00,790.00,500.00,2024-01-16
EURUSD,buy,10000,1.0850,,0.00,2024-01-17
```

## 🎨 Design Principles

- **Privacy First**: All data stays on device
- **Performance**: Smooth 60fps animations
- **Accessibility**: Full accessibility support
- **Modern**: Latest React Native patterns
- **Maintainable**: Clean architecture and TypeScript

## 🔒 Privacy & Security

- **Local Storage**: All data stored locally on device
- **No Cloud**: No external data transmission
- **Secure**: MMKV encrypted storage
- **Private**: Complete user privacy

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support and questions, please open an issue in the repository.

---

Built with ❤️ using React Native and modern development practices.