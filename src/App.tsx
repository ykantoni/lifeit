import { Board } from './components/Board/Board';
import { AddTileButton } from './components/Toolbar/AddTileButton';
import { useLocalStorageSync } from './persistence/useLocalStorageSync';

function App() {
  useLocalStorageSync();

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Tile Board</h1>
          <p>Frequently used, recently created tiles grow. Drag a tile onto another to group it.</p>
        </div>
        <AddTileButton />
      </header>
      <main className="app-main">
        <Board />
      </main>
    </div>
  );
}

export default App;
