import { Navigate, useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import { ResourceCrudPage } from '../components/common/ResourceCrudPage';
import { getModuleConfig } from '../config/modules';
import { useAuth } from '../contexts/AuthContext';
import { getModuleReadPermission } from '../utils/access';

interface GenericModulePageProps {
  moduleKey?: string;
}

export function GenericModulePage({ moduleKey: moduleKeyProp }: GenericModulePageProps) {
  const params = useParams<{ moduleKey: string }>();
  const moduleKey = moduleKeyProp ?? params.moduleKey;
  const config = getModuleConfig(moduleKey);
  const { hasPermission } = useAuth();

  if (!config) {
    return <Alert severity="error">Unknown module: {moduleKey}</Alert>;
  }

  const permission = getModuleReadPermission(config.key);
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/sales/enquiries" replace />;
  }

  return (
    <ResourceCrudPage
      key={config.key}
      title={config.title}
      endpoint={config.endpoint}
      columns={config.columns}
      fields={config.fields}
      idField={config.idField}
      searchPlaceholder={config.searchPlaceholder}
      disableCreate={config.disableCreate}
      disableEdit={config.disableEdit}
      disableDelete={config.disableDelete}
      transformSubmit={config.transformSubmit}
    />
  );
}

export default GenericModulePage;
