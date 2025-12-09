import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import "./index.css"; // hoặc index.css của editor

function EditorLayout() {
  useEffect(() => {
    document.body.classList.add("editor-mode");
    return () => document.body.classList.remove("editor-mode");
  }, []);

  return (
    <div className="editor-layout">
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default EditorLayout;
