-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ts" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "entry" REAL,
    "exit" REAL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "r_multiple" REAL,
    "realized_pnl" REAL,
    "order_id" TEXT,
    "fill_id" TEXT,
    "strategy_tag" TEXT,
    "account" TEXT,
    "raw" JSONB
);

-- CreateTable
CREATE TABLE "Signal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ts" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "reason" TEXT,
    "timeframe" TEXT,
    "entry" REAL,
    "stop" REAL,
    "target" REAL,
    "confidence" REAL,
    "strategy_tag" TEXT,
    "raw" JSONB
);

-- CreateTable
CREATE TABLE "Experiment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "strategy_tag" TEXT,
    "params" JSONB,
    "metrics" JSONB,
    "source" TEXT,
    "raw" JSONB
);

-- CreateTable
CREATE TABLE "Journal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ts" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trade_id" TEXT,
    "text" TEXT,
    "tags" TEXT,
    CONSTRAINT "Journal_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "Trade" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Trade_ts_idx" ON "Trade"("ts");

-- CreateIndex
CREATE INDEX "Signal_ts_idx" ON "Signal"("ts");

-- CreateIndex
CREATE INDEX "Journal_trade_id_idx" ON "Journal"("trade_id");

-- CreateIndex
CREATE INDEX "Journal_ts_idx" ON "Journal"("ts");
