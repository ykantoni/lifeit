import { Board } from './components/Board/Board';
import { AddTileButton } from './components/Toolbar/AddTileButton';
import { FileSyncControl } from './components/Toolbar/FileSyncControl';
import { SettingsControl } from './components/Toolbar/SettingsControl';
import { useLocalStorageSync } from './persistence/useLocalStorageSync';
import { useFileSync } from './hooks/useFileSync';

function App() {
  useLocalStorageSync();
  const fileSync = useFileSync();

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Tile Board</h1>
          <p>Frequently used, recently created tiles grow. Drag a tile onto another to group it.</p>
        </div>
        <div className="header-actions">
          <SettingsControl />
          <FileSyncControl api={fileSync} />
          <AddTileButton />
        </div>
      </header>
      <main className="app-main">
        <Board />
      </main>
    </div>
  );
}

export default App;
