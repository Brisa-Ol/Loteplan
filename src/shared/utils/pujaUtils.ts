import PujaService from "@/core/api/services/puja.service";

export const finalizarSubasta = async (idLote: number) => {
  return PujaService.manageAuctionEnd(idLote, null);
};