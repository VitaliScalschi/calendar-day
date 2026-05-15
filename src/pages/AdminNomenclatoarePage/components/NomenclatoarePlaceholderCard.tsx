export type NomenclatoarePlaceholderCardProps = {
  title: string;
};

/** Conținut pentru rutele nomenclatoare fără tabel (rezervat extinderi viitoare). */
export function NomenclatoarePlaceholderCard({ title }: NomenclatoarePlaceholderCardProps) {
  return (
    <>
      <h5 className="mb-2">{title}</h5>
      <p className="text-muted mb-0">
        Secțiunea este pregătită în meniu și poate fi completată cu nomenclatoarele necesare.
      </p>
    </>
  );
}
