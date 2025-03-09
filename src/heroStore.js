import { create } from 'zustand';

const useHeroStore = create((set) => ({
  heroHealth: 100,
  pickupFinished: false,
  setPickupFinished: (value) => set({ pickupFinished: value }),
  addHealth: (amount) =>
    set((state) => ({
      heroHealth: state.heroHealth + amount
    }))
}));

export default useHeroStore;
