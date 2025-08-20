-- CreateTable
CREATE TABLE "Bar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "ts" DATETIME NOT NULL,
    "o" REAL NOT NULL,
    "h" REAL NOT NULL,
    "l" REAL NOT NULL,
    "c" REAL NOT NULL,
    "v" REAL
);

-- CreateIndex
CREATE INDEX "Bar_symbol_timeframe_ts_idx" ON "Bar"("symbol", "timeframe", "ts");

-- CreateIndex
CREATE UNIQUE INDEX "Bar_symbol_timeframe_ts_key" ON "Bar"("symbol", "timeframe", "ts");
