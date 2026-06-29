import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '../lib/store.js';
import { fetchCandles, loadCandlesFromCsv } from '../lib/dataService.js';
import { analyzePatterns } from '../lib/patternRecognition.js';
import { trainModel, runMonteCarlo, saveModelToCache, loadModelFromCache, resetModelCache } from '../lib/predictionEngine.js';
import { clamp, formatPrice, formatChange } from '../lib/utils.js';
import TickerBar from '../components/TickerBar.jsx';
import StatsBar from '../components/StatsBar.jsx';
import GhostChart from '../components/GhostChart.jsx';
import Sidebar from '../components/Sidebar.jsx';
import LoadingOverlay from '../components/LoadingOverlay.jsx';
import DataErrorPanel from '../components/DataErrorPanel.jsx';
import DisclaimerBar from '../components/DisclaimerBar.jsx';

const CACHE_KEY = 'ghostcandle_global_model_v2';

export default function Dashboard() {
  const [uploadFallback, setUploadFallback] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [isUploadMode, setIsUploadMode] = useState(false);
  const store = useStore();
  const {
    ticker,
    timeframe,
    candles,
    predictions,
    dataSource,
    isLoadingData,
    dataError,
    isTraining,
    trainingProgress,
    trainingLoss,
    modelData,
    modelCached,
    isRunningPrediction,
    patterns,
    numFutureCandles,
    numSimulations,
  } = store;

  const { data, refetch, isFetching } = useQuery({
    queryKey: ['candles', ticker, timeframe],
    queryFn: async () => {
      const response = await fetchCandles(ticker, timeframe);
      return response;
    },
    enabled: !isUploadMode,
    onSuccess: (result) => {
      store.setCandles(result.candles);
      store.setDataSource(result.source);
      store.setDataError(null);
      store.setPatterns(analyzePatterns(result.candles));
    },
    onError: (error) => {
      store.setDataError(error.message);
    },
  });

  useEffect(() => {
    const cache = loadModelFromCache(CACHE_KEY);
    if (cache) {
      store.setModelData(cache);
    }
  }, []);

  useEffect(() => {
    if (data) {
      store.setCandles(data.candles);
      store.setDataSource(data.source);
      store.setPatterns(analyzePatterns(data.candles));
    }
  }, [data]);

  const currentPrice = candles.length ? candles[candles.length - 1].close : null;
  const previousPrice = candles.length > 1 ? candles[candles.length - 2].close : null;
  const periodHigh = candles.length ? Math.max(...candles.map((c) => c.high)) : null;
  const periodLow = candles.length ? Math.min(...candles.map((c) => c.low)) : null;
  const averageVolume = candles.length ? Math.round(candles.slice(-20).reduce((sum, c) => sum + c.volume, 0) / Math.min(candles.length, 20)) : null;

  const [fetchDebug, setFetchDebug] = useState(null);
  const handleManualFetch = async () => {
    try {
      setFetchDebug({ status: 'working' });
      store.setIsLoadingData(true);
      const res = await fetchCandles(ticker, timeframe);
      store.setCandles(res.candles);
      store.setDataSource(res.source);
      store.setPatterns(analyzePatterns(res.candles));
      setFetchDebug({ status: 'ok', count: res.candles.length, source: res.source });
    } catch (err) {
      setFetchDebug({ status: 'error', message: err.message });
    } finally {
      store.setIsLoadingData(false);
    }
  };

  const handleTrain = async () => {
    if (!candles.length) return;
    store.setIsTraining(true);
    store.setTrainingProgress(0);
    store.setTrainingLoss(null);
    const model = await trainModel(candles, Math.min(10, Math.max(5, Math.floor(numFutureCandles / 2))));
    saveModelToCache(CACHE_KEY, model);
    store.setModelData(model);
    store.setIsTraining(false);
    store.setTrainingProgress(100);
    store.setTrainingLoss(model.loss);
  };

  const handlePredict = async () => {
    if (!modelData || !candles.length) return;
    store.setIsRunningPrediction(true);
    const slice = candles.slice(-30);
    const avgVolume = candles.slice(-20).reduce((sum, row) => sum + row.volume, 0) / Math.min(20, candles.length) || 1;
    const lastWindow = slice.map((c, idx) => {
      const previous = idx > 0 ? slice[idx - 1] : c;
      const prevClose = previous.close;
      const range = c.high - c.low || 1;
      const body_ratio = Math.abs(c.close - c.open) / range;
      const upper_wick = (c.high - Math.max(c.open, c.close)) / range;
      const lower_wick = (Math.min(c.open, c.close) - c.low) / range;
      return [
        clamp((c.close - prevClose) / prevClose * 0.5 + 0.5, 0, 1),
        clamp((c.high - c.low) / prevClose / 0.06, 0, 1),
        clamp(body_ratio, 0, 1),
        clamp(upper_wick, 0, 1),
        clamp(lower_wick, 0, 1),
        clamp(c.volume / avgVolume / 5, 0, 1),
      ];
    });
    const result = runMonteCarlo(modelData, lastWindow, numFutureCandles, numSimulations);
    store.setPredictions(result);
    store.setIsRunningPrediction(false);
  };

  const handleUpload = async (file) => {
    try {
      const records = await loadCandlesFromCsv(file);
      if (!records.length) {
        setUploadError('Uploaded CSV did not contain valid OHLCV data.');
        return;
      }
      setUploadError('');
      store.setCandles(records);
      store.setDataSource('CSV Upload');
      store.setPatterns(analyzePatterns(records));
      setUploadFallback(records);
      setIsUploadMode(true);
    } catch (error) {
      setUploadError('Could not parse CSV file.');
    }
  };

  const clearUpload = () => {
    setUploadFallback(null);
    setIsUploadMode(false);
  };

  const handleResetModel = () => {
    resetModelCache(CACHE_KEY);
    store.setModelData(null);
    store.setPredictions(null);
  };

  return (
    <div className="min-h-screen bg-bg text-fg px-4 py-5">
      <div className="mx-auto max-w-[1700px] space-y-5">
        <TickerBar
          ticker={ticker}
          timeframe={timeframe}
          isLoadingData={isFetching}
          isTraining={isTraining}
          isPredicting={isRunningPrediction}
          onTickerChange={store.setTicker}
          onTimeframeChange={store.setTimeframe}
          onRefresh={() => refetch()}
          onTrain={handleTrain}
          onPredict={handlePredict}
          errorMessage={dataError}
        />

        <StatsBar
          ticker={ticker}
          price={currentPrice}
          change={formatChange(currentPrice, previousPrice)}
          high={periodHigh}
          low={periodLow}
          range52="N/A"
          volume={averageVolume}
          source={dataSource}
        />

        {!candles.length && !dataError && (
          <div className="rounded-3xl border border-slate-700/80 bg-slate-950/70 p-4 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">No market data</div>
                <div className="mt-1 text-xs text-slate-400">No candles available for the selected ticker/timeframe.</div>
                <div className="mt-2 text-xs text-slate-400">If you use API keys, ensure provider allows CORS requests from the browser.</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button onClick={handleManualFetch} className="rounded-2xl bg-ghost px-4 py-2 text-sm font-semibold">Fetch now</button>
                {fetchDebug && (
                  <div className="text-xs text-slate-300 mt-1">
                    {fetchDebug.status === 'working' && 'Fetching…'}
                    {fetchDebug.status === 'ok' && `Fetched ${fetchDebug.count} candles from ${fetchDebug.source}`}
                    {fetchDebug.status === 'error' && `Error: ${fetchDebug.message}`}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[1.55fr_0.85fr]">
          <GhostChart
            candles={candles}
            predictions={predictions}
            showVolume={store.showVolume}
            showMA={store.showMA}
            showBollingerBands={store.showBollingerBands}
            showRSI={store.showRSI}
            showMACD={store.showMACD}
            showConfidenceBands={store.showConfidenceBands}
            activePatternId={store.activePatternId}
            onPatternSelect={store.setActivePatternId}
          />
          <Sidebar
            patterns={patterns}
            activeTab={store.activeSidebarTab}
            onSetTab={store.setActiveSidebarTab}
            predictionMode={store.predictionMode}
            onPredictionMode={store.setPredictionMode}
            numFutureCandles={numFutureCandles}
            onNumFutureCandles={store.setNumFutureCandles}
            numSimulations={numSimulations}
            onNumSimulations={store.setNumSimulations}
            showVolume={store.showVolume}
            showConfidenceBands={store.showConfidenceBands}
            showMA={store.showMA}
            showBollingerBands={store.showBollingerBands}
            showRSI={store.showRSI}
            showMACD={store.showMACD}
            onToggleVolume={store.setShowVolume}
            onToggleConfidence={store.setShowConfidenceBands}
            onToggleMA={store.setShowMA}
            onToggleBollinger={store.setShowBollingerBands}
            onToggleRSI={store.setShowRSI}
            onToggleMACD={store.setShowMACD}
            modelData={modelData}
            modelCached={modelCached}
            trainingProgress={trainingProgress}
            trainingLoss={trainingLoss}
            onResetModel={handleResetModel}
            onUpload={handleUpload}
            uploadError={uploadError}
            isUploadMode={isUploadMode}
            clearUpload={clearUpload}
          />
        </div>

        <DisclaimerBar />
      </div>

      {(isFetching || isTraining || isRunningPrediction) && (
        <LoadingOverlay
          loading={isFetching || isTraining || isRunningPrediction}
          title={isTraining ? 'Training AI' : isRunningPrediction ? 'Predicting future candles' : 'Loading market data'}
          subtitle={isTraining ? 'Optimizing the in-browser neural model.' : isRunningPrediction ? 'Simulating ghost candle paths.' : 'Fetching OHLCV data from public source.'}
          progress={trainingProgress}
          loss={trainingLoss}
        />
      )}

      {dataError && <DataErrorPanel error={dataError} onRetry={() => refetch()} onUpload={handleUpload} />}
    </div>
  );
}
