//+------------------------------------------------------------------+
//|                  ScalpGridHedge_Premium.mq4                       |
//|           Premium Exclusive EA - Scalping+Grid+Hedging            |
//|         Institutional-Grade Bi-Directional Recovery System        |
//+------------------------------------------------------------------+
#property copyright "Premium Quant Systems"
#property link      "https://premiumquant.com"
#property version   "3.00"
#property strict
#property description "Premium Exclusive: Scalping + Dynamic Grid + Bi-Directional Hedging"
#property description "Designed for Cent Accounts | M1/M5 Timeframes"
#property description "Institutional Risk Management & Net Profit Closure"

//+------------------------------------------------------------------+
//| ENUMERATIONS                                                      |
//+------------------------------------------------------------------+
enum ENUM_TRADE_MODE
{
   MODE_BIDIRECTIONAL = 0, // Bi-Directional (Buy & Sell)
   MODE_BUY_ONLY      = 1, // Buy Only
   MODE_SELL_ONLY      = 2  // Sell Only
};

//+------------------------------------------------------------------+
//| INPUT PARAMETERS                                                  |
//+------------------------------------------------------------------+
//--- General Settings
extern string     _gen_sep          = "══════ GENERAL SETTINGS ══════";
extern int        MagicBuy          = 111111;       // Magic Number Buy Basket
extern int        MagicSell         = 222222;       // Magic Number Sell Basket
extern ENUM_TRADE_MODE TradeMode    = MODE_BIDIRECTIONAL; // Trade Mode

//--- Scalping & Grid Settings
extern string     _scalp_sep        = "══════ SCALPING & GRID ══════";
extern double     BaseLot           = 0.10;         // Base Lot Size
extern double     LotMultiplier     = 1.5;          // Lot Multiplier (Grid Progression)
extern double     MaxLotSize        = 5.0;          // Maximum Lot Per Order
extern int        MaxGridLevels     = 8;            // Max Grid Levels Per Direction
extern double     GridStepPips      = 15.0;         // Default Grid Step (Pips)
extern bool       UseATRGrid        = true;         // Use ATR for Dynamic Grid Step
extern int        ATRPeriod         = 14;           // ATR Period
extern double     ATRMultiplier     = 1.5;          // ATR Multiplier for Grid Step
extern double     ScalpTPPips       = 5.0;          // Fast Scalp TP Per Order (Pips)
extern double     BasketTPPips      = 3.0;          // Basket TP from Average Price (Pips)

//--- Hedging & Netting Settings
extern string     _hedge_sep        = "══════ HEDGING & NETTING ══════";
extern double     GlobalNetProfit   = 200.0;        // Global Net Profit Target (Cent)
extern bool       EnableNetClose    = true;         // Enable Global Net Profit Close

//--- Risk Control & Filters
extern string     _risk_sep         = "══════ RISK MANAGEMENT ══════";
extern int        MaxSpreadPoints   = 30;           // Max Spread (Points)
extern int        MaxSlippage       = 3;            // Max Slippage (Points)
extern double     MaxDrawdownPct    = 30.0;         // Max Drawdown % (Emergency Close)
extern double     DailyTargetProfit = 1000.0;       // Daily Profit Target (Cent)
extern double     DailyStopLoss     = 500.0;        // Daily Stop Loss (Cent)
extern double     MinFreeMarginPct  = 200.0;        // Min Margin Level % to Open Orders

//--- Session Filter
extern string     _sess_sep         = "══════ SESSION FILTER ══════";
extern bool       UseSessionFilter  = true;         // Enable Session Filter
extern int        SessionStartHour  = 1;            // Session Start Hour (Server)
extern int        SessionStartMin   = 0;            // Session Start Minute
extern int        SessionEndHour    = 22;           // Session End Hour (Server)
extern int        SessionEndMin     = 0;            // Session End Minute

//--- Indicator Settings
extern string     _ind_sep          = "══════ INDICATORS ══════";
extern int        BB_Period         = 20;           // Bollinger Bands Period
extern double     BB_Deviation      = 2.0;          // Bollinger Bands Deviation
extern int        RSI_Period        = 7;            // RSI Period
extern double     RSI_OB            = 70.0;         // RSI Overbought Level
extern double     RSI_OS            = 30.0;         // RSI Oversold Level

//--- Dashboard Settings
extern string     _dash_sep         = "══════ DASHBOARD ══════";
extern bool       ShowDashboard     = true;         // Show On-Chart Dashboard
extern int        DashboardX        = 20;           // Dashboard X Position
extern int        DashboardY        = 30;           // Dashboard Y Position
extern color      DashColor1        = clrWhite;     // Dashboard Title Color
extern color      DashColor2        = clrLimeGreen; // Dashboard Profit Color
extern color      DashColor3        = clrOrangeRed; // Dashboard Loss Color
extern color      DashColor4        = clrGold;      // Dashboard Info Color
extern int        DashFontSize      = 9;            // Dashboard Font Size

//+------------------------------------------------------------------+
//| GLOBAL VARIABLES                                                  |
//+------------------------------------------------------------------+
double g_point;
int    g_digits;
double g_pipFactor;        // Conversion factor: pips -> price
double g_dailyStartBalance;
int    g_dayOfYear;
bool   g_dailyTargetHit;
bool   g_dailyStopHit;
string g_prefix = "SGH_";  // Dashboard object prefix

//+------------------------------------------------------------------+
//| INITIALIZATION                                                    |
//+------------------------------------------------------------------+
int OnInit()
{
   //--- Detect broker digit precision
   g_digits = (int)MarketInfo(Symbol(), MODE_DIGITS);
   g_point  = MarketInfo(Symbol(), MODE_POINT);
   
   //--- Pip factor: for 5-digit brokers (e.g., EURUSD 1.12345)
   if(g_digits == 3 || g_digits == 5)
      g_pipFactor = g_point * 10.0;
   else
      g_pipFactor = g_point;
   
   //--- Initialize daily tracking
   g_dayOfYear        = DayOfYear();
   g_dailyStartBalance = AccountBalance();
   g_dailyTargetHit   = false;
   g_dailyStopHit     = false;
   
   Print("═══════════════════════════════════════════════");
   Print("  ScalpGridHedge Premium v3.0 Initialized");
   Print("  Symbol: ", Symbol(), " | Digits: ", g_digits);
   Print("  Point: ", g_point, " | PipFactor: ", g_pipFactor);
   Print("  MagicBuy: ", MagicBuy, " | MagicSell: ", MagicSell);
   Print("═══════════════════════════════════════════════");
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| DEINITIALIZATION                                                  |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   DeleteDashboard();
}

//+------------------------------------------------------------------+
//| MAIN TICK FUNCTION                                                |
//+------------------------------------------------------------------+
void OnTick()
{
   //--- Reset daily counters on new day
   ResetDailyCounters();
   
   //--- Calculate current daily P&L
   double dailyPnL = CalculateDailyPnL();
   
   //--- Check daily limits
   CheckDailyLimits(dailyPnL);
   
   //--- EMERGENCY: Equity Hard Stop
   if(CheckEquityHardStop())
   {
      GlobalClose();
      return;
   }
   
   //--- GLOBAL NET PROFIT CLOSURE (Highest Priority)
   if(EnableNetClose)
   {
      double netProfit = CalculateNetProfit();
      if(netProfit >= GlobalNetProfit)
      {
         Print("★ GLOBAL NET PROFIT TARGET REACHED: ", DoubleToStr(netProfit, 2), " cent");
         GlobalClose();
         return;
      }
   }
   
   //--- BASKET TP CHECK (Per Direction)
   CheckBasketTP(OP_BUY,  MagicBuy);
   CheckBasketTP(OP_SELL, MagicSell);
   
   //--- INDIVIDUAL SCALP TP (Fast Close)
   CheckIndividualScalpTP();
   
   //--- If daily target/stop hit, don't open new orders
   if(g_dailyTargetHit || g_dailyStopHit)
   {
      if(ShowDashboard) DrawDashboard();
      return;
   }
   
   //--- SESSION FILTER
   if(!IsWithinSession())
   {
      if(ShowDashboard) DrawDashboard();
      return;
   }
   
   //--- SPREAD FILTER
   if(!IsSpreadOK())
   {
      if(ShowDashboard) DrawDashboard();
      return;
   }
   
   //--- GRID MANAGEMENT (Recovery Orders)
   if(TradeMode == MODE_BIDIRECTIONAL || TradeMode == MODE_BUY_ONLY)
      ManageGrid(OP_BUY, MagicBuy);
      
   if(TradeMode == MODE_BIDIRECTIONAL || TradeMode == MODE_SELL_ONLY)
      ManageGrid(OP_SELL, MagicSell);
   
   //--- SCALPING ENTRY (New Signals)
   if(TradeMode == MODE_BIDIRECTIONAL || TradeMode == MODE_BUY_ONLY)
      CheckEntryBuy();
      
   if(TradeMode == MODE_BIDIRECTIONAL || TradeMode == MODE_SELL_ONLY)
      CheckEntrySell();
   
   //--- DASHBOARD
   if(ShowDashboard) DrawDashboard();
}

//+------------------------------------------------------------------+
//| DAILY COUNTER RESET                                              |
//+------------------------------------------------------------------+
void ResetDailyCounters()
{
   if(DayOfYear() != g_dayOfYear)
   {
      g_dayOfYear        = DayOfYear();
      g_dailyStartBalance = AccountBalance();
      g_dailyTargetHit   = false;
      g_dailyStopHit     = false;
      Print("═══ NEW TRADING DAY ═══ Balance: ", DoubleToStr(g_dailyStartBalance, 2));
   }
}

//+------------------------------------------------------------------+
//| CALCULATE DAILY P&L                                              |
//+------------------------------------------------------------------+
double CalculateDailyPnL()
{
   double closedPnL = 0;
   
   //--- Sum today's closed orders
   for(int i = OrdersHistoryTotal() - 1; i >= 0; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) continue;
      if(OrderSymbol() != Symbol()) continue;
      if(OrderMagicNumber() != MagicBuy && OrderMagicNumber() != MagicSell) continue;
      
      //--- Only count today's closed orders
      if(TimeDay(OrderCloseTime()) == Day() && 
         TimeMonth(OrderCloseTime()) == Month() && 
         TimeYear(OrderCloseTime()) == Year())
      {
         closedPnL += OrderProfit() + OrderSwap() + OrderCommission();
      }
   }
   
   //--- Add current floating
   double floatingPnL = CalculateNetProfit();
   
   return(closedPnL + floatingPnL);
}

//+------------------------------------------------------------------+
//| CHECK DAILY LIMITS                                               |
//+------------------------------------------------------------------+
void CheckDailyLimits(double dailyPnL)
{
   //--- Check daily profit target
   if(DailyTargetProfit > 0 && dailyPnL >= DailyTargetProfit && !g_dailyTargetHit)
   {
      Print("★★★ DAILY PROFIT TARGET REACHED: ", DoubleToStr(dailyPnL, 2), " cent ★★★");
      GlobalClose();
      g_dailyTargetHit = true;
   }
   
   //--- Check daily stop loss (compare closed PnL only for stop)
   double closedOnly = 0;
   for(int i = OrdersHistoryTotal() - 1; i >= 0; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) continue;
      if(OrderSymbol() != Symbol()) continue;
      if(OrderMagicNumber() != MagicBuy && OrderMagicNumber() != MagicSell) continue;
      if(TimeDay(OrderCloseTime()) == Day() && 
         TimeMonth(OrderCloseTime()) == Month() && 
         TimeYear(OrderCloseTime()) == Year())
      {
         closedOnly += OrderProfit() + OrderSwap() + OrderCommission();
      }
   }
   double totalWithFloating = closedOnly + CalculateNetProfit();
   
   if(DailyStopLoss > 0 && totalWithFloating <= -DailyStopLoss && !g_dailyStopHit)
   {
      Print("✖✖✖ DAILY STOP LOSS HIT: ", DoubleToStr(totalWithFloating, 2), " cent ✖✖✖");
      GlobalClose();
      g_dailyStopHit = true;
   }
}

//+------------------------------------------------------------------+
//| EQUITY HARD STOP CHECK                                           |
//+------------------------------------------------------------------+
bool CheckEquityHardStop()
{
   if(MaxDrawdownPct <= 0) return(false);
   
   double balance = AccountBalance();
   double equity  = AccountEquity();
   
   if(balance <= 0) return(false);
   
   double drawdownPct = ((balance - equity) / balance) * 100.0;
   
   if(drawdownPct >= MaxDrawdownPct)
   {
      Print("⚠️ EMERGENCY EQUITY HARD STOP! Drawdown: ", DoubleToStr(drawdownPct, 2), 
            "% >= ", DoubleToStr(MaxDrawdownPct, 2), "%");
      return(true);
   }
   
   return(false);
}

//+------------------------------------------------------------------+
//| SESSION FILTER                                                    |
//+------------------------------------------------------------------+
bool IsWithinSession()
{
   if(!UseSessionFilter) return(true);
   
   int currentMinutes = Hour() * 60 + Minute();
   int startMinutes   = SessionStartHour * 60 + SessionStartMin;
   int endMinutes     = SessionEndHour * 60 + SessionEndMin;
   
   //--- Handle overnight sessions (e.g., 22:00 - 06:00)
   if(startMinutes < endMinutes)
   {
      return(currentMinutes >= startMinutes && currentMinutes < endMinutes);
   }
   else
   {
      return(currentMinutes >= startMinutes || currentMinutes < endMinutes);
   }
}

//+------------------------------------------------------------------+
//| SPREAD FILTER                                                     |
//+------------------------------------------------------------------+
bool IsSpreadOK()
{
   int spread = (int)MarketInfo(Symbol(), MODE_SPREAD);
   return(spread <= MaxSpreadPoints);
}

//+------------------------------------------------------------------+
//| MARGIN CHECK                                                      |
//+------------------------------------------------------------------+
bool IsMarginSafe()
{
   if(MinFreeMarginPct <= 0) return(true);
   
   double marginLevel = 0;
   if(AccountMargin() > 0)
      marginLevel = (AccountEquity() / AccountMargin()) * 100.0;
   else
      return(true); // No open positions = safe
   
   return(marginLevel >= MinFreeMarginPct);
}

//+------------------------------------------------------------------+
//| COUNT ORDERS BY TYPE AND MAGIC                                   |
//+------------------------------------------------------------------+
int CountOrders(int orderType, int magic)
{
   int count = 0;
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;
      if(OrderSymbol() != Symbol()) continue;
      if(OrderMagicNumber() != magic) continue;
      if(OrderType() == orderType)
         count++;
   }
   return(count);
}

//+------------------------------------------------------------------+
//| GET LAST ORDER OPEN PRICE BY TYPE AND MAGIC                      |
//+------------------------------------------------------------------+
double GetLastOrderPrice(int orderType, int magic)
{
   double lastPrice = 0;
   datetime lastTime = 0;
   
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;
      if(OrderSymbol() != Symbol()) continue;
      if(OrderMagicNumber() != magic) continue;
      if(OrderType() != orderType) continue;
      
      if(OrderOpenTime() > lastTime)
      {
         lastTime  = OrderOpenTime();
         lastPrice = OrderOpenPrice();
      }
   }
   return(lastPrice);
}

//+------------------------------------------------------------------+
//| GET LAST ORDER LOT SIZE                                          |
//+------------------------------------------------------------------+
double GetLastOrderLot(int orderType, int magic)
{
   double lastLot = 0;
   datetime lastTime = 0;
   
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;
      if(OrderSymbol() != Symbol()) continue;
      if(OrderMagicNumber() != magic) continue;
      if(OrderType() != orderType) continue;
      
      if(OrderOpenTime() > lastTime)
      {
         lastTime = OrderOpenTime();
         lastLot  = OrderLots();
      }
   }
   return(lastLot);
}

//+------------------------------------------------------------------+
//| CALCULATE BASKET FLOATING PROFIT                                 |
//+------------------------------------------------------------------+
double CalculateBasketProfit(int orderType, int magic)
{
   double profit = 0;
   
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;
      if(OrderSymbol() != Symbol()) continue;
      if(OrderMagicNumber() != magic) continue;
      if(OrderType() != orderType) continue;
      
      profit += OrderProfit() + OrderSwap() + OrderCommission();
   }
   return(profit);
}

//+------------------------------------------------------------------+
//| CALCULATE TOTAL NET PROFIT (ALL POSITIONS)                       |
//+------------------------------------------------------------------+
double CalculateNetProfit()
{
   double totalProfit = 0;
   
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;
      if(OrderSymbol() != Symbol()) continue;
      if(OrderMagicNumber() != MagicBuy && OrderMagicNumber() != MagicSell) continue;
      
      totalProfit += OrderProfit() + OrderSwap() + OrderCommission();
   }
   return(totalProfit);
}

//+------------------------------------------------------------------+
//| CALCULATE AVERAGE PRICE OF BASKET                                |
//+------------------------------------------------------------------+
double CalculateAveragePrice(int orderType, int magic)
{
   double totalLots  = 0;
   double totalPrice = 0;
   
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;
      if(OrderSymbol() != Symbol()) continue;
      if(OrderMagicNumber() != magic) continue;
      if(OrderType() != orderType) continue;
      
      totalLots  += OrderLots();
      totalPrice += OrderOpenPrice() * OrderLots();
   }
   
   if(totalLots > 0)
      return(NormalizeDouble(totalPrice / totalLots, g_digits));
   
   return(0);
}

//+------------------------------------------------------------------+
//| CALCULATE TOTAL LOTS IN BASKET                                   |
//+------------------------------------------------------------------+
double CalculateTotalLots(int orderType, int magic)
{
   double totalLots = 0;
   
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;
      if(OrderSymbol() != Symbol()) continue;
      if(OrderMagicNumber() != magic) continue;
      if(OrderType() != orderType) continue;
      
      totalLots += OrderLots();
   }
   return(totalLots);
}

//+------------------------------------------------------------------+
//| GET DYNAMIC GRID STEP (ATR-Based)                                |
//+------------------------------------------------------------------+
double GetGridStep()
{
   if(UseATRGrid)
   {
      double atr = iATR(Symbol(), Period(), ATRPeriod, 1);
      double dynamicStep = atr * ATRMultiplier;
      
      //--- Minimum step = 50% of default, Maximum = 200% of default
      double minStep = GridStepPips * g_pipFactor * 0.5;
      double maxStep = GridStepPips * g_pipFactor * 2.0;
      
      if(dynamicStep < minStep) dynamicStep = minStep;
      if(dynamicStep > maxStep) dynamicStep = maxStep;
      
      return(dynamicStep);
   }
   
   return(GridStepPips * g_pipFactor);
}

//+------------------------------------------------------------------+
//| CALCULATE NEXT GRID LOT                                          |
//+------------------------------------------------------------------+
double CalculateNextLot(int level)
{
   double lot = BaseLot;
   
   for(int i = 1; i < level; i++)
   {
      lot = NormalizeDouble(lot * LotMultiplier, 2);
   }
   
   //--- Enforce limits
   double minLot  = MarketInfo(Symbol(), MODE_MINLOT);
   double maxLot  = MarketInfo(Symbol(), MODE_MAXLOT);
   double lotStep = MarketInfo(Symbol(), MODE_LOTSTEP);
   
   if(lot < minLot) lot = minLot;
   if(lot > MaxLotSize) lot = MaxLotSize;
   if(lot > maxLot) lot = maxLot;
   
   //--- Normalize to lot step
   lot = NormalizeDouble(MathFloor(lot / lotStep) * lotStep, 2);
   
   if(lot < minLot) lot = minLot;
   
   return(lot);
}

//+------------------------------------------------------------------+
//| SCALPING ENTRY: CHECK BUY SIGNAL                                 |
//+------------------------------------------------------------------+
void CheckEntryBuy()
{
   //--- Only enter if no Buy positions exist (first entry = scalp)
   if(CountOrders(OP_BUY, MagicBuy) > 0) return;
   
   //--- Margin check
   if(!IsMarginSafe()) return;
   
   //--- Bollinger Bands
   double bbLower = iBands(Symbol(), Period(), BB_Period, BB_Deviation, 0, PRICE_CLOSE, MODE_LOWER, 1);
   double bbMiddle = iBands(Symbol(), Period(), BB_Period, BB_Deviation, 0, PRICE_CLOSE, MODE_MAIN, 1);
   
   //--- RSI
   double rsi = iRSI(Symbol(), Period(), RSI_Period, PRICE_CLOSE, 1);
   
   //--- Buy Signal: Price at/below Lower Band AND RSI Oversold
   double closePrice = iClose(Symbol(), Period(), 1);
   
   if(closePrice <= bbLower && rsi <= RSI_OS)
   {
      string comment = "SGH_Buy_1";
      double price   = NormalizeDouble(Ask, g_digits);
      
      int ticket = OrderSend(Symbol(), OP_BUY, BaseLot, price, MaxSlippage, 
                             0, 0, comment, MagicBuy, 0, clrDodgerBlue);
      
      if(ticket > 0)
         Print("✓ SCALP BUY Entry: Ticket=", ticket, " Price=", price, " Lot=", BaseLot);
      else
         Print("✖ SCALP BUY Error: ", GetLastError());
   }
}

//+------------------------------------------------------------------+
//| SCALPING ENTRY: CHECK SELL SIGNAL                                |
//+------------------------------------------------------------------+
void CheckEntrySell()
{
   //--- Only enter if no Sell positions exist (first entry = scalp)
   if(CountOrders(OP_SELL, MagicSell) > 0) return;
   
   //--- Margin check
   if(!IsMarginSafe()) return;
   
   //--- Bollinger Bands
   double bbUpper  = iBands(Symbol(), Period(), BB_Period, BB_Deviation, 0, PRICE_CLOSE, MODE_UPPER, 1);
   double bbMiddle = iBands(Symbol(), Period(), BB_Period, BB_Deviation, 0, PRICE_CLOSE, MODE_MAIN, 1);
   
   //--- RSI
   double rsi = iRSI(Symbol(), Period(), RSI_Period, PRICE_CLOSE, 1);
   
   //--- Sell Signal: Price at/above Upper Band AND RSI Overbought
   double closePrice = iClose(Symbol(), Period(), 1);
   
   if(closePrice >= bbUpper && rsi >= RSI_OB)
   {
      string comment = "SGH_Sell_1";
      double price   = NormalizeDouble(Bid, g_digits);
      
      int ticket = OrderSend(Symbol(), OP_SELL, BaseLot, price, MaxSlippage, 
                             0, 0, comment, MagicSell, 0, clrOrangeRed);
      
      if(ticket > 0)
         Print("✓ SCALP SELL Entry: Ticket=", ticket, " Price=", price, " Lot=", BaseLot);
      else
         Print("✖ SCALP SELL Error: ", GetLastError());
   }
}

//+------------------------------------------------------------------+
//| GRID MANAGEMENT (Dynamic Recovery Orders)                        |
//+------------------------------------------------------------------+
void ManageGrid(int orderType, int magic)
{
   int count = CountOrders(orderType, magic);
   
   //--- No grid if no initial position
   if(count <= 0) return;
   
   //--- Max grid levels check
   if(count >= MaxGridLevels) return;
   
   //--- Margin check
   if(!IsMarginSafe()) return;
   
   //--- Spread check for grid entries too
   if(!IsSpreadOK()) return;
   
   //--- Get last order price
   double lastPrice = GetLastOrderPrice(orderType, magic);
   if(lastPrice <= 0) return;
   
   //--- Get dynamic grid step
   double gridStep = GetGridStep();
   
   //--- Calculate distance from last order
   double currentPrice;
   double distance;
   
   if(orderType == OP_BUY)
   {
      currentPrice = Ask;
      distance = lastPrice - currentPrice; // Price dropped below last buy
   }
   else
   {
      currentPrice = Bid;
      distance = currentPrice - lastPrice; // Price rose above last sell
   }
   
   //--- Open grid order if price moved enough against us
   if(distance >= gridStep)
   {
      int nextLevel = count + 1;
      double nextLot = CalculateNextLot(nextLevel);
      
      string comment = "SGH_" + (orderType == OP_BUY ? "Buy_" : "Sell_") + IntegerToString(nextLevel);
      
      double price;
      color  clr;
      
      if(orderType == OP_BUY)
      {
         price = NormalizeDouble(Ask, g_digits);
         clr = clrDodgerBlue;
      }
      else
      {
         price = NormalizeDouble(Bid, g_digits);
         clr = clrOrangeRed;
      }
      
      int ticket = OrderSend(Symbol(), orderType, nextLot, price, MaxSlippage, 
                             0, 0, comment, magic, 0, clr);
      
      if(ticket > 0)
      {
         Print("✓ GRID ", (orderType == OP_BUY ? "BUY" : "SELL"), 
               " Level ", nextLevel, ": Ticket=", ticket, 
               " Price=", price, " Lot=", nextLot);
      }
      else
      {
         Print("✖ GRID ", (orderType == OP_BUY ? "BUY" : "SELL"), 
               " Error: ", GetLastError());
      }
   }
}

//+------------------------------------------------------------------+
//| CHECK INDIVIDUAL SCALP TP (Fast Close for Single Orders)         |
//+------------------------------------------------------------------+
void CheckIndividualScalpTP()
{
   double tpDistance = ScalpTPPips * g_pipFactor;
   
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;
      if(OrderSymbol() != Symbol()) continue;
      if(OrderMagicNumber() != MagicBuy && OrderMagicNumber() != MagicSell) continue;
      
      int magic = OrderMagicNumber();
      int orderType = OrderType();
      
      //--- Only apply individual TP if this is the ONLY order in its basket
      int basketCount = CountOrders(orderType, magic);
      if(basketCount > 1) continue; // Use basket TP for multi-order baskets
      
      double profit = 0;
      
      if(orderType == OP_BUY)
      {
         profit = Bid - OrderOpenPrice();
      }
      else if(orderType == OP_SELL)
      {
         profit = OrderOpenPrice() - Ask;
      }
      
      if(profit >= tpDistance)
      {
         double closePrice = (orderType == OP_BUY) ? 
                             NormalizeDouble(Bid, g_digits) : 
                             NormalizeDouble(Ask, g_digits);
         
         bool closed = OrderClose(OrderTicket(), OrderLots(), closePrice, MaxSlippage, clrYellow);
         
         if(closed)
            Print("★ SCALP TP HIT: Ticket=", OrderTicket(), " Profit=", 
                  DoubleToStr(profit / g_pipFactor, 1), " pips");
         else
            Print("✖ SCALP TP Close Error: ", GetLastError());
      }
   }
}

//+------------------------------------------------------------------+
//| CHECK BASKET TP (Directional Basket Close)                       |
//+------------------------------------------------------------------+
void CheckBasketTP(int orderType, int magic)
{
   int count = CountOrders(orderType, magic);
   
   //--- Basket TP only applies for multi-order baskets
   if(count <= 1) return;
   
   double avgPrice = CalculateAveragePrice(orderType, magic);
   if(avgPrice <= 0) return;
   
   double tpDistance = BasketTPPips * g_pipFactor;
   double currentProfit = 0;
   
   if(orderType == OP_BUY)
   {
      currentProfit = Bid - avgPrice;
   }
   else
   {
      currentProfit = avgPrice - Ask;
   }
   
   if(currentProfit >= tpDistance)
   {
      Print("★ BASKET TP: ", (orderType == OP_BUY ? "BUY" : "SELL"), 
            " basket | AvgPrice=", DoubleToStr(avgPrice, g_digits),
            " | Orders=", count);
      
      if(orderType == OP_BUY)
         CloseAllBuy();
      else
         CloseAllSell();
   }
}

//+------------------------------------------------------------------+
//| CLOSE ALL BUY ORDERS                                             |
//+------------------------------------------------------------------+
void CloseAllBuy()
{
   int errors = 0;
   
   for(int attempt = 0; attempt < 5; attempt++) // Retry loop
   {
      bool allClosed = true;
      
      for(int i = OrdersTotal() - 1; i >= 0; i--)
      {
         if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;
         if(OrderSymbol() != Symbol()) continue;
         if(OrderMagicNumber() != MagicBuy) continue;
         if(OrderType() != OP_BUY) continue;
         
         double closePrice = NormalizeDouble(Bid, g_digits);
         
         // Refresh rates before closing
         RefreshRates();
         closePrice = NormalizeDouble(Bid, g_digits);
         
         bool closed = OrderClose(OrderTicket(), OrderLots(), closePrice, MaxSlippage * 3, clrLimeGreen);
         
         if(!closed)
         {
            int err = GetLastError();
            Print("✖ CloseAllBuy Error: Ticket=", OrderTicket(), " Error=", err);
            errors++;
            allClosed = false;
            Sleep(100);
         }
         else
         {
            Print("✓ Closed Buy: Ticket=", OrderTicket());
         }
      }
      
      if(allClosed || CountOrders(OP_BUY, MagicBuy) == 0)
         break;
         
      Sleep(200);
   }
   
   if(errors > 0)
      Print("⚠ CloseAllBuy completed with ", errors, " errors");
}

//+------------------------------------------------------------------+
//| CLOSE ALL SELL ORDERS                                            |
//+------------------------------------------------------------------+
void CloseAllSell()
{
   int errors = 0;
   
   for(int attempt = 0; attempt < 5; attempt++) // Retry loop
   {
      bool allClosed = true;
      
      for(int i = OrdersTotal() - 1; i >= 0; i--)
      {
         if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;
         if(OrderSymbol() != Symbol()) continue;
         if(OrderMagicNumber() != MagicSell) continue;
         if(OrderType() != OP_SELL) continue;
         
         double closePrice = NormalizeDouble(Ask, g_digits);
         
         // Refresh rates before closing
         RefreshRates();
         closePrice = NormalizeDouble(Ask, g_digits);
         
         bool closed = OrderClose(OrderTicket(), OrderLots(), closePrice, MaxSlippage * 3, clrOrangeRed);
         
         if(!closed)
         {
            int err = GetLastError();
            Print("✖ CloseAllSell Error: Ticket=", OrderTicket(), " Error=", err);
            errors++;
            allClosed = false;
            Sleep(100);
         }
         else
         {
            Print("✓ Closed Sell: Ticket=", OrderTicket());
         }
      }
      
      if(allClosed || CountOrders(OP_SELL, MagicSell) == 0)
         break;
         
      Sleep(200);
   }
   
   if(errors > 0)
      Print("⚠ CloseAllSell completed with ", errors, " errors");
}

//+------------------------------------------------------------------+
//| GLOBAL CLOSE (ALL POSITIONS)                                     |
//+------------------------------------------------------------------+
void GlobalClose()
{
   Print("═══ EXECUTING GLOBAL CLOSE ALL ═══");
   
   double netBefore = CalculateNetProfit();
   
   //--- Close sells first (usually in profit during recovery), then buys
   CloseAllSell();
   CloseAllBuy();
   
   //--- Final verification
   int remaining = CountOrders(OP_BUY, MagicBuy) + CountOrders(OP_SELL, MagicSell);
   
   if(remaining > 0)
   {
      Print("⚠ WARNING: ", remaining, " orders still open after GlobalClose. Retrying...");
      Sleep(500);
      CloseAllBuy();
      CloseAllSell();
   }
   
   Print("═══ GLOBAL CLOSE COMPLETE | Net Before Close: ", DoubleToStr(netBefore, 2), " cent ═══");
}

//+------------------------------------------------------------------+
//| DASHBOARD - DELETE ALL OBJECTS                                   |
//+------------------------------------------------------------------+
void DeleteDashboard()
{
   int total = ObjectsTotal();
   for(int i = total - 1; i >= 0; i--)
   {
      string name = ObjectName(i);
      if(StringFind(name, g_prefix) == 0)
         ObjectDelete(name);
   }
}

//+------------------------------------------------------------------+
//| DASHBOARD - CREATE/UPDATE LABEL                                  |
//+------------------------------------------------------------------+
void DashLabel(string name, int x, int y, string text, color clr, int fontSize = 0)
{
   if(fontSize == 0) fontSize = DashFontSize;
   
   string objName = g_prefix + name;
   
   if(ObjectFind(objName) < 0)
   {
      ObjectCreate(objName, OBJ_LABEL, 0, 0, 0);
      ObjectSet(objName, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSet(objName, OBJPROP_SELECTABLE, false);
   }
   
   ObjectSet(objName, OBJPROP_XDISTANCE, x);
   ObjectSet(objName, OBJPROP_YDISTANCE, y);
   ObjectSetText(objName, text, fontSize, "Consolas", clr);
}

//+------------------------------------------------------------------+
//| DASHBOARD - DRAW COMPLETE DASHBOARD                              |
//+------------------------------------------------------------------+
void DrawDashboard()
{
   int x = DashboardX;
   int y = DashboardY;
   int lineH = (int)(DashFontSize * 1.8);  // Line height
   int col2  = x + 220;                     // Second column
   int row   = 0;
   
   //--- Header
   DashLabel("hdr1", x, y + lineH * row, "╔══════════════════════════════════════╗", DashColor4, DashFontSize);
   row++;
   DashLabel("hdr2", x, y + lineH * row, "║  SCALPGRIDHEDGE PREMIUM v3.0        ║", DashColor1, DashFontSize + 1);
   row++;
   DashLabel("hdr3", x, y + lineH * row, "║  Scalping + Grid + Hedging Engine   ║", DashColor4, DashFontSize);
   row++;
   DashLabel("hdr4", x, y + lineH * row, "╠══════════════════════════════════════╣", DashColor4, DashFontSize);
   row++;
   
   //--- Account Info
   double balance    = AccountBalance();
   double equity     = AccountEquity();
   double freeMargin = AccountFreeMargin();
   double marginLvl  = 0;
   if(AccountMargin() > 0) marginLvl = (AccountEquity() / AccountMargin()) * 100.0;
   
   DashLabel("bal", x, y + lineH * row, 
             "  Balance:     " + DoubleToStr(balance, 2), DashColor1);
   row++;
   
   color eqColor = (equity >= balance) ? DashColor2 : DashColor3;
   DashLabel("eq", x, y + lineH * row, 
             "  Equity:      " + DoubleToStr(equity, 2), eqColor);
   row++;
   
   DashLabel("fm", x, y + lineH * row, 
             "  Free Margin: " + DoubleToStr(freeMargin, 2) + 
             "  (Lvl: " + DoubleToStr(marginLvl, 1) + "%)", DashColor1);
   row++;
   
   //--- Separator
   DashLabel("sep1", x, y + lineH * row, "╠══════════════════════════════════════╣", DashColor4);
   row++;
   
   //--- Buy Basket Info
   int    buyCount    = CountOrders(OP_BUY, MagicBuy);
   double buyProfit   = CalculateBasketProfit(OP_BUY, MagicBuy);
   double buyAvg      = CalculateAveragePrice(OP_BUY, MagicBuy);
   double buyLots     = CalculateTotalLots(OP_BUY, MagicBuy);
   
   color buyColor = (buyProfit >= 0) ? DashColor2 : DashColor3;
   DashLabel("buy1", x, y + lineH * row, 
             "  BUY Basket:  " + IntegerToString(buyCount) + " orders | " + 
             DoubleToStr(buyLots, 2) + " lots", clrDodgerBlue);
   row++;
   DashLabel("buy2", x, y + lineH * row, 
             "  Buy Float:   " + DoubleToStr(buyProfit, 2) + " | Avg: " + 
             DoubleToStr(buyAvg, g_digits), buyColor);
   row++;
   
   //--- Sell Basket Info
   int    sellCount   = CountOrders(OP_SELL, MagicSell);
   double sellProfit  = CalculateBasketProfit(OP_SELL, MagicSell);
   double sellAvg     = CalculateAveragePrice(OP_SELL, MagicSell);
   double sellLots    = CalculateTotalLots(OP_SELL, MagicSell);
   
   color sellColor = (sellProfit >= 0) ? DashColor2 : DashColor3;
   DashLabel("sell1", x, y + lineH * row, 
             "  SELL Basket: " + IntegerToString(sellCount) + " orders | " + 
             DoubleToStr(sellLots, 2) + " lots", clrOrangeRed);
   row++;
   DashLabel("sell2", x, y + lineH * row, 
             "  Sell Float:  " + DoubleToStr(sellProfit, 2) + " | Avg: " + 
             DoubleToStr(sellAvg, g_digits), sellColor);
   row++;
   
   //--- Separator
   DashLabel("sep2", x, y + lineH * row, "╠══════════════════════════════════════╣", DashColor4);
   row++;
   
   //--- Net Floating
   double netFloat = buyProfit + sellProfit;
   color netColor = (netFloat >= 0) ? DashColor2 : DashColor3;
   DashLabel("net", x, y + lineH * row, 
             "  NET FLOAT:   " + DoubleToStr(netFloat, 2) + " cent", netColor, DashFontSize + 1);
   row++;
   
   //--- Spread
   int currentSpread = (int)MarketInfo(Symbol(), MODE_SPREAD);
   color spColor = (currentSpread <= MaxSpreadPoints) ? DashColor2 : DashColor3;
   DashLabel("spread", x, y + lineH * row, 
             "  Spread:      " + IntegerToString(currentSpread) + " pts (Max: " + 
             IntegerToString(MaxSpreadPoints) + ")", spColor);
   row++;
   
   //--- Grid Step
   double currentStep = GetGridStep() / g_pipFactor;
   DashLabel("grid", x, y + lineH * row, 
             "  Grid Step:   " + DoubleToStr(currentStep, 1) + " pips" + 
             (UseATRGrid ? " (ATR)" : " (Fixed)"), DashColor4);
   row++;
   
   //--- Daily PnL
   double dailyPnL = CalculateDailyPnL();
   color dailyColor = (dailyPnL >= 0) ? DashColor2 : DashColor3;
   DashLabel("daily", x, y + lineH * row, 
             "  Daily PnL:   " + DoubleToStr(dailyPnL, 2) + " / " + 
             DoubleToStr(DailyTargetProfit, 2) + " cent", dailyColor);
   row++;
   
   //--- Global Net Target
   DashLabel("target", x, y + lineH * row, 
             "  Net Target:  " + DoubleToStr(GlobalNetProfit, 2) + " cent" +
             (EnableNetClose ? " [ON]" : " [OFF]"), DashColor4);
   row++;
   
   //--- Drawdown
   double ddPct = 0;
   if(balance > 0) ddPct = ((balance - equity) / balance) * 100.0;
   color ddColor = (ddPct < MaxDrawdownPct * 0.7) ? DashColor2 : DashColor3;
   DashLabel("dd", x, y + lineH * row, 
             "  Drawdown:    " + DoubleToStr(ddPct, 2) + "% (Max: " + 
             DoubleToStr(MaxDrawdownPct, 1) + "%)", ddColor);
   row++;
   
   //--- Status
   string status = "";
   if(g_dailyTargetHit) status = "DAILY TARGET HIT - PAUSED";
   else if(g_dailyStopHit) status = "DAILY STOP LOSS - PAUSED";
   else if(!IsWithinSession()) status = "OUTSIDE SESSION";
   else if(!IsSpreadOK()) status = "SPREAD TOO WIDE";
   else if(!IsMarginSafe()) status = "LOW MARGIN";
   else status = "ACTIVE - SCANNING";
   
   color statColor = clrLimeGreen;
   if(StringFind(status, "PAUSED") >= 0 || StringFind(status, "STOP") >= 0) statColor = clrOrangeRed;
   else if(StringFind(status, "OUTSIDE") >= 0 || StringFind(status, "WIDE") >= 0 || 
           StringFind(status, "LOW") >= 0) statColor = clrYellow;
   
   DashLabel("sep3", x, y + lineH * row, "╠══════════════════════════════════════╣", DashColor4);
   row++;
   DashLabel("status", x, y + lineH * row, 
             "  Status: " + status, statColor, DashFontSize + 1);
   row++;
   
   //--- Trade Mode
   string modeStr = "";
   switch(TradeMode)
   {
      case MODE_BIDIRECTIONAL: modeStr = "BI-DIRECTIONAL"; break;
      case MODE_BUY_ONLY:     modeStr = "BUY ONLY";       break;
      case MODE_SELL_ONLY:    modeStr = "SELL ONLY";       break;
   }
   DashLabel("mode", x, y + lineH * row, 
             "  Mode:   " + modeStr, DashColor4);
   row++;
   
   //--- Footer
   DashLabel("ftr", x, y + lineH * row, "╚══════════════════════════════════════╝", DashColor4);
}

//+------------------------------------------------------------------+
//| END OF EA                                                         |
//+------------------------------------------------------------------+
