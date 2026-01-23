import React, { useMemo } from 'react';
import {
  Box, Typography, Button, Chip, IconButton, Stack, Tooltip,
  MenuItem, Switch, alpha, Avatar
} from '@mui/material';
import {
  Add, Edit, Visibility as VisibilityIcon, MonetizationOn as MonetizationOnIcon,
  Image as ImageIcon, PlayArrow, Apartment as ApartmentIcon,
} from '@mui/icons-material';

import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';
import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { FilterBar, FilterSearch, FilterSelect } from '../../../../shared/components/forms/filters/FilterBar/FilterBar';
import { ConfirmDialog } from '../../../../shared/components/domain/modals/ConfirmDialog/ConfirmDialog';

// Modales
import CreateProyectoModal from './components/modals/CreateProyectoModal';
import ConfigCuotasModal from './components/modals/ConfigCuotasModal';
import EditProyectoModal from './components/modals/EditProyectoModal';
import ProjectLotesModal from './components/modals/ProjectLotesModal';
import ManageImagesModal from './components/modals/ManageImagesModal';

import { useAdminProyectos, type TipoInversionFilter } from '../../hooks/useAdminProyectos';
import type { ProyectoDto } from '../../../../core/types/dto/proyecto.dto';

const AdminProyectos: React.FC = () => {
  const logic = useAdminProyectos(); 

  const columns = useMemo<DataTableColumn<ProyectoDto>[]>(() => [
    {
      id: 'proyecto', label: 'Proyecto / ID',
      render: (p) => (
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar variant="rounded" sx={{ bgcolor: alpha(logic.theme.palette.primary.main, 0.1), color: 'primary.main' }}>
            <ApartmentIcon />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700}>{p.nombre_proyecto}</Typography>
            <Typography variant="caption" color="text.secondary">ID: {p.id}</Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'tipo', label: 'Tipo',
      render: (p) => <Chip label={p.tipo_inversion === 'mensual' ? 'Ahorro' : 'Directo'} size="small" color={p.tipo_inversion === 'mensual' ? 'primary' : 'default'} />
    },
    {
        id: 'finanzas', label: 'Inversión',
        render: (p) => <Typography variant="body2" fontWeight={600}>{p.moneda} {Number(p.monto_inversion).toLocaleString()}</Typography>
    },
    {
      id: 'visibilidad', label: 'Visibilidad', align: 'center',
      render: (p) => (
        <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
          <Switch 
            checked={p.activo} 
            onChange={() => logic.modales.confirmDialog.confirm('toggle_project_visibility', p)} 
            size="small" 
            color="success" 
            disabled={logic.isToggling}
          />
          <Typography variant="caption" fontWeight={600} color={p.activo ? 'success.main' : 'text.disabled'}>
            {p.activo ? 'Visible' : 'Oculto'}
          </Typography>
        </Stack>
      )
    },
    {
      id: 'acciones', label: 'Acciones', align: 'right',
      render: (p) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Imágenes"><IconButton onClick={(e) => logic.handleAction(p, 'images', e)} size="small" color="primary"><ImageIcon fontSize="small" /></IconButton></Tooltip>
          
          {p.tipo_inversion === 'mensual' && (
            <Tooltip title="Ver/Editar Cuotas"><IconButton onClick={(e) => logic.handleAction(p, 'cuotas', e)} size="small"><MonetizationOnIcon fontSize="small" /></IconButton></Tooltip>
          )}
          
          {p.tipo_inversion === 'mensual' && p.estado_proyecto === 'En Espera' && (
            <Tooltip title="Iniciar Cobros (Manual)"><IconButton onClick={() => logic.modales.confirmDialog.confirm('start_project_process', p)} size="small" sx={{ color: "success.main" }}><PlayArrow fontSize="small" /></IconButton></Tooltip>
          )}
          
          <Tooltip title="Editar"><IconButton onClick={(e) => logic.handleAction(p, 'edit', e)} size="small"><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Lotes"><IconButton onClick={(e) => logic.handleAction(p, 'lotes', e)} size="small" color="info"><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
        </Stack>
      )
    }
  ], [logic]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader title="Gestión de Proyectos" subtitle="Administra el catálogo de inversiones y estados." />

      <FilterBar>
        <FilterSearch 
            placeholder="Buscar por nombre..." 
            value={logic.searchTerm} 
            onSearch={logic.setSearchTerm}
            sx={{ flexGrow: 1 }}
        />
        
        <FilterSelect 
            label="Tipo de Inversión"
            value={logic.filterTipo}
            onChange={(e) => logic.setFilterTipo(e.target.value as TipoInversionFilter)}
            sx={{ minWidth: 200 }}
        >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="directo">Directo</MenuItem>
            <MenuItem value="mensual">Ahorro</MenuItem>
        </FilterSelect>

        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={logic.modales.create.open}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Nuevo Proyecto
        </Button>
      </FilterBar>

      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error}>
          <DataTable 
            columns={columns} 
            data={logic.filteredProyectos} 
            getRowKey={(p) => p.id} 
            
            // ✨ PROPIEDAD CLAVE AGREGADA:
            // Esto activa la opacidad automática en DataTable para proyectos inactivos
            isRowActive={(p) => p.activo}
            
            highlightedRowId={logic.highlightedId} 
            pagination={true} 
          />
      </QueryHandler>

      {/* --- MODALES --- */}
      <CreateProyectoModal
        {...logic.modales.create.modalProps} 
        onSubmit={logic.handleCreateSubmit}
      />

      {logic.selectedProject && (
        <>
          <ConfigCuotasModal 
            open={logic.modales.cuotas.isOpen}
            onClose={logic.modales.cuotas.close}
            proyecto={logic.selectedProject} 
          />
          
          <EditProyectoModal 
            open={logic.modales.edit.isOpen}
            onClose={logic.modales.edit.close}
            proyecto={logic.selectedProject} 
            onSubmit={logic.handleUpdateSubmit} 
            isLoading={logic.isUpdating} 
          />
          
          <ProjectLotesModal 
            open={logic.modales.lotes.isOpen}
            onClose={logic.modales.lotes.close}
            proyecto={logic.selectedProject} 
          />
          
          <ManageImagesModal 
            open={logic.modales.images.isOpen}
            onClose={logic.modales.images.close}
            proyecto={logic.selectedProject} 
          />
        </>
      )}

      <ConfirmDialog 
        controller={logic.modales.confirmDialog}
        onConfirm={logic.handleConfirmAction}
        isLoading={logic.isStarting || logic.isToggling}
      />

    </PageContainer>
  );
};

export default AdminProyectos;