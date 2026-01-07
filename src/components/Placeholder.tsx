
interface PlaceholderProps {
    title: string;
}

export default function Placeholder({ title }: PlaceholderProps) {
    return (
        <div className="flex flex-col items-center justify-center h-96 text-slate-400">
            <h2 className="text-2xl font-bold mb-2">{title}</h2>
            <p>Bu modül henüz yapım aşamasındadır.</p>
        </div>
    );
}
