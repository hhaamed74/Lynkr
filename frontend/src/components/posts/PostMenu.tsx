import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/components/_posts.scss";

interface Props {
  onEdit: () => void;
  onHide: () => void;
  onDelete: () => void;
  onCopy: () => void;
}

export const PostMenu: React.FC<Props> = ({
  onEdit,
  onHide,
  onDelete,
  onCopy,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="pc-menuWrap">
      <button className="pc-flatBtn" onClick={() => setOpen((o) => !o)}>
        ⋮
      </button>
      {open && (
        <div className="pc-menuBox">
          <button className="pc-menuItem" onClick={onEdit}>
            ✏️ {t("PostCard.Edit")}
          </button>
          <button className="pc-menuItem" onClick={onHide}>
            🙈 {t("PostCard.Hide")}
          </button>
          <button className="pc-menuItem" onClick={onDelete}>
            🗑️ {t("PostCard.Delete")}
          </button>
          <button className="pc-menuItem" onClick={onCopy}>
            📋 {t("PostCard.CopyText")}
          </button>
        </div>
      )}
    </div>
  );
};
