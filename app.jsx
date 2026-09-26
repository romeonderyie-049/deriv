import { useEffect, useMemo, useRef, useState } from "react";
import { connectToDeriv } from "./deriv";
import {
  calculateProbabilities,
  getCounts,
  getLastDigit,
  getPrediction
} from "./predictor";

const MARKETS = [
  { name: "Volatility 10 Index", symbol: "R_10" },
  { name: "Volatility 25 Index", symbol: "R_25" },
  { name: "Volatility 50 Index", symbol: "R_50" },
  { name: "Volatility 75 Index", symbol: "R_75" },
  { name: "Volatility 100 Index", symbol: "R_100" }
];

const WINDOWS = [100, 500, 1000];

function App() {
  const [market, setMarket] = useState("R_100");
  const [windowSize, setWindowSize] = useState(500);

  const [digits, setDigits] = useState([]);
  const [lastQuote, setLastQuote] = useState("--");
  const [lastDigit, setLastDigit] = useState("--");

  const [status, setStatus] = useState("disconnected");
  const [error, setError] = useState("");

  const connectionRef = useRef(null);

  const probabilities = useMemo(
    () => calculateProbabilities(digits),
    [digits]
  );

  const counts = useMemo(() => getCounts(digits), [digits]);

  const prediction = useMemo(
    () => getPrediction(probabilities),
    [probabilities]
  );

  useEffect(() => {
    startConnection();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.close();
      }
    };
  }, [market]);

  function startConnection() {
    if (connectionRef.current) {
      connectionRef.current.close();
    }

    setDigits([]);
    setLastQuote("--");
    setLastDigit("--");
    setError("");
    setStatus("connecting");

    connectionRef.current = connectToDeriv(
      market,
      (tick) => {
        const digit = getLastDigit(tick.quote);

        if (digit === null) return;

        setLastQuote(String(tick.quote));
        setLastDigit(String(digit));

        setDigits((previous) => {
          const updated = [...previous, digit];

          if (updated.length > windowSize) {
            return updated.slice(updated.length - windowSize);
          }

          return updated;
        });
      },
      (newStatus) => {
        setStatus(newStatus);
      },
      (message) => {
        setError(message);
      }
    );
  }

  function handleMarketChange(event) {
    setMarket(event.target.value);
  }

  function handleWindowChange(event) {
    const value = Number(event.target.value);

    setWindowSize(value);

    setDigits((previous) => {
      if (previous.length <= value) return previous;
      return previous.slice(previous.length - value);
    });
  }

  function resetAnalysis() {
    setDigits([]);
    setLastQuote("--");
    setLastDigit("--");
    setError("");
  }

  const statusText =
    status === "connected"
      ? "LIVE"
      : status === "connecting"
      ? "CONNECTING"
      : status === "error"
      ? "ERROR"
      : "OFFLINE";

  const selectedMarket =
    MARKETS.find((item) => item.symbol === market)?.name || market;

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>DERIV DIGIT ANALYZER</h1>
          <p>Live 0–9 tick analysis</p>
        </div>

        <div className={`status ${status}`}>
          <span className="status-dot"></span>
          {statusText}
        </div>
      </header>

      <section className="controls card">
        <div className="control">
          <label>Market</label>

          <select value={market} onChange={handleMarketChange}>
            {MARKETS.map((item) => (
              <option value={item.symbol} key={item.symbol}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="control">
          <label>Analysis window</label>

          <select value={windowSize} onChange={handleWindowChange}>
            {WINDOWS.map((value) => (
              <option value={value} key={value}>
                {value} ticks
              </option>
            ))}
          </select>
        </div>

        <button className="reset" onClick={resetAnalysis}>
          RESET
        </button>
      </section>

      {error && (
        <div className="error card">
          {error}
        </div>
      )}

      <section className="hero card">
        <p className="label">HIGHEST CURRENT ESTIMATE</p>

        <div className="big-digit">
          {digits.length ? prediction.digit : "--"}
        </div>

        <div className="confidence">
          {digits.length
            ? `${prediction.probability.toFixed(2)}%`
            : "--"}
        </div>

        <p className="small">
          This is a statistical estimate from the selected tick window,
          not a guaranteed prediction.
        </p>
      </section>

      <section className="stats-grid">
        <div className="stat card">
          <span>MARKET</span>
          <strong>{selectedMarket}</strong>
        </div>

        <div className="stat card">
          <span>LAST QUOTE</span>
          <strong>{lastQuote}</strong>
        </div>

        <div className="stat card">
          <span>LAST DIGIT</span>
          <strong>{lastDigit}</strong>
        </div>

        <div className="stat card">
          <span>TICKS</span>
          <strong>{digits.length}</strong>
        </div>
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Digit probabilities</h2>
          <span>0–9</span>
        </div>

        <div className="digit-list">
          {probabilities.map((probability, digit) => {
            const isHighest =
              digits.length > 0 && digit === prediction.digit;

            return (
              <div
                className={`digit-row ${
                  isHighest ? "highest" : ""
                }`}
                key={digit}
              >
                <div className="digit-number">{digit}</div>

                <div className="bar-container">
                  <div
                    className="bar"
                    style={{
                      width: `${Math.min(probability, 100)}%`
                    }}
                  ></div>
                </div>

                <div className="percentage">
                  {probability.toFixed(2)}%
                </div>

                <div className="count">
                  {counts[digit]}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Recent digits</h2>
          <span>{Math.min(digits.length, 20)}</span>
        </div>

        <div className="recent">
          {digits.length === 0 ? (
            <span className="muted">Waiting for ticks...</span>
          ) : (
            digits
              .slice(-20)
              .reverse()
              .map((digit, index) => (
                <span className="recent-digit" key={`${index}-${digit}`}>
                  {digit}
                </span>
              ))
          )}
        </div>
      </section>

      <footer>
        <p>
          Analysis only. No trades are automatically placed.
        </p>
        <p>
          Past tick frequencies do not guarantee the next digit.
        </p>
      </footer>
    </div>
  );
}

export default App;
