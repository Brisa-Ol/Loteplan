// src/features/admin/pages/Lotes/AdminLotes.tsx

import React, { useMemo } from 'react';
// Icons
import {
  Add, AssignmentLate, CheckCircle, Collections, Edit, Gavel,
  GridView, Inventory, StopCircle, ViewList,
  Visibility
} from '@mui/icons-material';
// MUI Components
import {
  Avatar, Box, Button, Card, CardContent, Chip,
  Divider, IconButton, MenuItem, Stack, Switch, ToggleButton,
  ToggleButtonGroup, Tooltip, Typography, alpha, useTheme
} from '@mui/material';

// Shared & Core
import imagenService from '@/core/api/services/imagen.service';
import type { CreateLoteDto, LoteDto, UpdateLoteDto } from '@/core/types/dto/lote.dto';
import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '@/shared/components/domain/cards/StatCard/StatCard';
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog/ConfirmDialog';
import { FilterBar, FilterSearch, FilterSelect } from '@/shared/components/forms/filters/FilterBar';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';
import { useAdminLotes } from '../../hooks/lotes/useAdminLotes';

// Modals
import AuctionControlModal from './modals/AuctionControlModal';
import CreateLoteModal from './modals/CreateLoteModal';
import EditLoteModal from './modals/EditLoteModal';
import LoteOverviewModal from './modals/LoteOverviewModal';
import ManageLoteImagesModal from './modals/ManageLoteImagesModal';
import theme from '@/core/theme';

// ============================================================================
// COMPONENTE: CARD DE LOTE
// ============================================================================
const LoteCard: React.FC<{
  lote: LoteDto;
  proyecto: any;
  onOverview: () => void;
  onEdit: () => void;
  onImages: () => void;
  onAuction: () => void;
  onToggle: () => void;
  isToggling: boolean;
  canSubastar: boolean;
}> = React.memo(({ lote, proyecto, onOverview, onEdit, onImages, onAuction, onToggle, isToggling, canSubastar }) => {
  const theme = useTheme();
  const isInversionista = proyecto?.tipo_inversion === 'directo';

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: '1px solid',
        borderColor: lote.activo ? 'divider' : alpha(theme.palette.divider, 0.3),
        borderRadius: 4,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: lote.activo ? 1 : 0.6,
        '&:hover': {
          boxShadow: lote.activo ? theme.shadows[8] : 'none',
          borderColor: 'primary.main',
          transform: lote.activo ? 'translateY(-4px)' : 'none',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" mb={2.5}>
          <Avatar
            src={lote.imagenes?.[0] ? imagenService.resolveImageUrl(lote.imagenes[0].url) : undefined}
            variant="rounded"
            sx={{ width: 52, height: 52, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 2 }}
          >
            <Inventory sx={{ color: theme.palette.primary.main }} />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" noWrap fontWeight={700}>{lote.nombre_lote}</Typography>
            <Typography variant="caption" color="text.secondary">ID: {lote.id}</Typography>
          </Box>
          <Switch checked={lote.activo} onChange={onToggle} size="small" color="success" disabled={isToggling} />
        </Stack>

        <Stack spacing={1.5} mb={3}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip
              label={proyecto?.nombre_proyecto || "Sin Proyecto"}
              size="small"
              variant="outlined"
              color={lote.id_proyecto ? "primary" : "warning"}
            />
            <Chip
              label={isInversionista ? '💼 INVERSIONISTA' : '🔨 SUBASTABLE'}
              size="small"
              sx={{ fontWeight: 800, fontSize: '0.65rem', bgcolor: alpha(theme.palette.action.hover, 0.05) }}
            />
          </Box>

          <Typography variant="h5" color="primary.main" fontWeight={900}>
            ${Number(lote.precio_base).toLocaleString('es-AR')}
          </Typography>

          <Chip
            label={lote.estado_subasta.toUpperCase()}
            size="small"
            variant={lote.estado_subasta === 'pendiente' ? 'outlined' : 'filled'}
            color={lote.estado_subasta === 'activa' ? 'success' : lote.estado_subasta === 'finalizada' ? 'info' : 'warning'}
            sx={{ alignSelf: 'flex-start' }}
          />
        </Stack>

        <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />

        <Stack direction="row" justifyContent="space-between">
          <Stack direction="row" spacing={1}>
            <Tooltip title="Ver Detalles">
              <IconButton onClick={onOverview} size="small" sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }}>
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Imágenes">
              <IconButton onClick={onImages} size="small" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                <Collections fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Editar">
              <IconButton onClick={onEdit} size="small" sx={{ bgcolor: alpha(theme.palette.action.active, 0.05) }}>
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          <Tooltip title={canSubastar ? 'Gestionar Subasta' : 'No subastable'}>
            <IconButton
              onClick={onAuction}
              disabled={!lote.activo || !canSubastar}
              sx={{
                bgcolor: canSubastar ? alpha(lote.estado_subasta === 'activa' ? theme.palette.error.main : theme.palette.success.main, 0.1) : 'transparent',
                color: lote.estado_subasta === 'activa' ? 'error.main' : 'success.main'
              }}
            >
              {lote.estado_subasta === 'activa' ? <StopCircle /> : <Gavel />}
            </IconButton>
          </Tooltip>
        </Stack>
      </CardContent>
    </Card>
  );
});

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const AdminLotes: React.FC = () => {
  const logic = useAdminLotes();

  // 1. Configuración para Proyectos (Lista larga con scroll y fuente reducida)
  const proyectoMenuProps = {
    anchorOrigin: { vertical: 'bottom' as const, horizontal: 'left' as const },
    transformOrigin: { vertical: 'top' as const, horizontal: 'left' as const },
    disableScrollLock: true,
    PaperProps: {
      sx: {
        mt: 1.4, // 🚀 Baja el menú para no tapar el label
        maxHeight: 300, 
        borderRadius: '12px',
        minWidth: 280,
        boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
        '& .MuiMenuItem-root': { fontSize: '0.85rem', py: 1 }, // 🚀 Letra más chica
      }
    }
  };

  // 2. Configuración para Estado (Compacto)
  const estadoMenuProps = {
    anchorOrigin: { vertical: 'bottom' as const, horizontal: 'left' as const },
    transformOrigin: { vertical: 'top' as const, horizontal: 'left' as const },
    disableScrollLock: true,
    PaperProps: {
      sx: {
        mt: 1.5,
        borderRadius: '10px',
        boxShadow: '0px 4px 15px rgba(0,0,0,0.08)',
        '& .MuiMenuItem-root': { fontSize: '0.85rem', py: 0.8 },
      }
    }
  };

  const columns = useMemo<DataTableColumn<LoteDto>[]>(() => [
    {
      id: 'lote',
      label: 'Lote / ID',
      minWidth: 180,
      render: (l) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            src={l.imagenes?.[0] ? imagenService.resolveImageUrl(l.imagenes[0].url) : undefined}
            variant="rounded"
            sx={{ width: 40, height: 40, bgcolor: alpha(logic.theme.palette.primary.main, 0.1) }}
          >
            <Inventory sx={{ color: logic.theme.palette.primary.main, fontSize: 20 }} />
          </Avatar>
          <Box minWidth={0}>
            <Typography variant="body2" fontWeight={600} noWrap>{l.nombre_lote}</Typography>
            <Typography variant="caption" color="text.secondary">ID: {l.id}</Typography>
          </Box>
        </Stack>
      ),
    },
    {
      id: 'proyecto',
      label: 'Proyecto',
      minWidth: 200,
      render: (l) => {
        const proyecto = logic.proyectos.find((p) => p.id === l.id_proyecto);
        return (
          <Stack spacing={0.5} alignItems="flex-start">
            <Chip label={proyecto?.nombre_proyecto || "S/P"} size="small" variant="outlined" color="primary" />
            <Typography variant="caption" fontWeight={800} color={proyecto?.tipo_inversion === 'directo' ? 'info.main' : 'warning.main'}>
              {proyecto?.tipo_inversion === 'directo' ? '💼 INVERSIONISTA' : '🔨 SUBASTABLE'}
            </Typography>
          </Stack>
        );
      },
    },
    {
      id: 'precio',
      label: 'Precio Base',
      render: (l) => (
        <Typography variant="body2" color="primary.main" fontWeight={700}>
          ${Number(l.precio_base).toLocaleString('es-AR')}
        </Typography>
      ),
    },
    {
      id: 'EstadoSubasta',
      label: 'Estado Subasta',
      render: (l) => (
        <Chip
          label={l.estado_subasta.toUpperCase()}
          size="small"
          color={l.estado_subasta === 'activa' ? 'success' : l.estado_subasta === 'finalizada' ? 'info' : 'warning'}
        />
      ),
    },
    {
      id: 'acciones',
      label: 'Gestión',
      align: 'right',
      render: (l) => (
        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Tooltip title="Ver Detalles">
            <IconButton onClick={() => logic.handleOpenOverview(l)} size="small" color="info">
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Gestionar Imágenes">
            <IconButton onClick={() => logic.handleManageImages(l)} size="small" color="success">
              <Collections fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Subasta">
            <IconButton onClick={() => logic.handleAuctionClick(l)} size="small" color="primary" disabled={!l.activo}>
              <Gavel fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton onClick={() => logic.handleOpenEdit(l)} size="small">
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [logic.proyectos, logic.theme, logic.isToggling]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} mb={4} spacing={2}>
        <Box>
          <Typography variant="h1" gutterBottom>Gestión de Lotes</Typography>
          <Typography variant="subtitle1" color="text.secondary">Inventario y control administrativo de subastas</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={logic.handleOpenCreate} >Nuevo Lote</Button>
      </Stack>

      {/* KPI GRID */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
        <StatCard title="Total Lotes" value={logic.stats.total} icon={<Inventory />} color="primary" loading={logic.loadingLotes} />
        <StatCard title="En Subasta" value={logic.stats.enSubasta} icon={<Gavel />} color="success" loading={logic.loadingLotes} />
        <StatCard title="Finalizados" value={logic.stats.finalizados} icon={<CheckCircle />} color="info" loading={logic.loadingLotes} />
        <StatCard title="Sin Proyecto" value={logic.stats.huerfanos} icon={<AssignmentLate />} color="warning" loading={logic.loadingLotes} />
      </Box>

      {/* FILTROS Y VISTA */}
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} mb={3} alignItems="center">
        <FilterBar sx={{ flex: 1, width: '100%' }}>
          <FilterSearch
            placeholder="Buscar por nombre o ID..."
            value={logic.searchTerm}
            onChange={(e) => logic.setSearchTerm(e.target.value)}
            sx={{ flex: 2 }}
          />
          
          {/* 🚀 FILTRO DE PROYECTO ACTUALIZADO */}
<FilterSelect 
  label="Proyecto" 
  value={logic.filterProject} 
  onChange={(e: any) => logic.setFilterProject(e.target.value)}
  SelectProps={{
    MenuProps: proyectoMenuProps 
  }}
>
  <MenuItem value="all">Todos los Lotes</MenuItem>
  {logic.proyectos.map((p) => (
    <MenuItem key={p.id} value={p.id} sx={{ py: 1.5 }}>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" width="100%">
        <Typography variant="body2">{p.nombre_proyecto}</Typography>
        
        {/* Etiqueta de Tipo */}
        <Chip 
          label={p.tipo_inversion === 'directo' ? 'DIRECTO' : 'MENSUAL'} 
          size="small"
          sx={{ 
            fontSize: '0.55rem', 
            height: 18, 
            fontWeight: 800,
            bgcolor: p.tipo_inversion === 'directo' ? alpha(theme.palette.info.main, 0.1) : alpha(theme.palette.warning.main, 0.1),
            color: p.tipo_inversion === 'directo' ? 'info.main' : 'warning.main',
            border: '1px solid',
            borderColor: 'transparent'
          }} 
        />
      </Stack>
    </MenuItem>
  ))}
</FilterSelect>

          <FilterSelect 
            label="Estado" 
            value={logic.filterEstadoSubasta} 
            onChange={(e: any) => logic.setFilterEstadoSubasta(e.target.value)}
            SelectProps={{
              MenuProps: estadoMenuProps
            }}
          >
            <MenuItem value="all">Cualquier Estado</MenuItem>
            <MenuItem value="activa">Activa</MenuItem>
            <MenuItem value="pendiente">Pendiente</MenuItem>
          </FilterSelect>
        </FilterBar>

        <ToggleButtonGroup value={logic.viewMode} exclusive onChange={(_, m) => m && logic.setViewMode(m)} size="small" sx={{ bgcolor: 'background.paper' }}>
          <ToggleButton value="table"><ViewList /></ToggleButton>
          <ToggleButton value="grid"><GridView /></ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <QueryHandler isLoading={logic.loadingLotes} error={logic.error as Error}>
        {logic.viewMode === 'grid' ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
            {logic.filteredLotes.map((lote) => (
              <LoteCard
                key={lote.id}
                lote={lote}
                proyecto={logic.proyectos.find(p => p.id === lote.id_proyecto)}
                onOverview={() => logic.handleOpenOverview(lote)}
                onEdit={() => logic.handleOpenEdit(lote)}
                onImages={() => logic.handleManageImages(lote)}
                onAuction={() => logic.handleAuctionClick(lote)}
                onToggle={() => logic.handleToggleActive(lote)}
                isToggling={logic.isToggling && logic.modales.confirm.data?.id === lote.id}
                canSubastar={logic.checkIsSubastable(lote).allowed}
              />
            ))}
          </Box>
        ) : (
          <DataTable columns={columns} data={logic.filteredLotes} getRowKey={(r) => r.id} pagination />
        )}
      </QueryHandler>

      <CreateLoteModal 
        {...logic.modales.create.modalProps} 
        onSubmit={async (data: CreateLoteDto, file: File | null) => { 
          await logic.saveLote({ dto: data, file }); 
        }} 
        isLoading={logic.isSaving} 
      />

      <EditLoteModal 
        {...logic.modales.edit.modalProps} 
        lote={logic.selectedLote} 
        onSubmit={async (id: number, data: UpdateLoteDto) => { 
          await logic.saveLote({ dto: data, id }); 
        }} 
        isLoading={logic.isSaving} 
      />

      {logic.selectedLote && (
        <>
          <ManageLoteImagesModal
            {...logic.modales.images.modalProps}
            lote={logic.selectedLote}
          />
          <LoteOverviewModal 
            open={logic.modales.overview.isOpen} 
            onClose={logic.modales.overview.close} 
            lote={logic.selectedLote} 
            proyecto={logic.proyectos.find(p => p.id === logic.selectedLote?.id_proyecto)} 
          />
          <AuctionControlModal 
            open={logic.modales.auction.isOpen} 
            onClose={logic.modales.auction.close} 
            lote={logic.selectedLote} 
            isLoading={logic.isAuctionLoading} 
            onStart={(id) => logic.startAuctionFn(id)} 
            onEnd={(id) => logic.endAuctionFn(id)} 
          />
        </>
      )}

      <ConfirmDialog controller={logic.modales.confirm} onConfirm={logic.handleConfirmAction} isLoading={logic.isToggling} />
    </PageContainer>
  );
};

export default AdminLotes;