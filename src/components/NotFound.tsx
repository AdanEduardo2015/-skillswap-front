import EmptyState from "../shared/ui/EmptyState";

function NotFound() {
  return (
    <EmptyState
      title="Error 404 pagina no encontrada"
      description="La ruta solicitada no existe o fue movida."
      minH="100vh"
    />
  );
}

export default NotFound;
