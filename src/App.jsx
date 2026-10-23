function App() {
  return (
    <main className="welcome">
      <section className="welcome__card" aria-labelledby="welcome-title">
        <p className="welcome__eyebrow">Learning Management System</p>
        <h1 id="welcome-title">Nền tảng học tập đang được xây dựng</h1>
        <p className="welcome__description">
            Chúng tôi đang xây dựng một nền tảng học tập hiện đại, giúp quản lý và theo dõi tiến trình học 
            tập một cách hiệu quả.
        </p>
        <div className="welcome__status">
          <span className="welcome__indicator" aria-hidden="true" />
          <span>Nền tảng ứng dụng đã sẵn sàng</span>
        </div>
      </section>
    </main>
  );
}

export default App;
