import { motion } from "framer-motion";
import { Subject, subjectInfo } from "@/lib/questions";

interface Props {
  onSelect: (subject: Subject) => void;
}

const subjects: Subject[] = ['basic', 'algebra', 'algebra2', 'geometry', 'chemistry'];

export default function SubjectSelect({ onSelect }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl md:text-6xl font-display font-bold text-foreground mb-2 tracking-tight"
      >
        Math<span className="text-primary">Sprint</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-muted-foreground mb-12 text-lg"
      >
        Train your mental math. Pick a subject.
      </motion.p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-2xl w-full">
        {subjects.map((s, i) => {
          const info = subjectInfo[s];
          return (
            <motion.button
              key={s}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              whileHover={{ scale: 1.04, boxShadow: "var(--glow-primary)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(s)}
              className="flex items-center gap-4 p-6 rounded-lg bg-card border border-border hover:border-primary transition-colors text-left"
            >
              <span className="text-3xl">{info.emoji}</span>
              <span className="text-lg font-display font-semibold text-card-foreground">{info.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
