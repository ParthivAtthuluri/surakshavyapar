import React from 'react';
import { BusinessBlueprint } from './BusinessBlueprint';
import { BlueprintData, Transaction } from '../types';

export interface LeanCanvasProps {
  blueprint: BlueprintData;
  setBlueprint: React.Dispatch<React.SetStateAction<BlueprintData>>;
  transactions: Transaction[];
}

export const LeanCanvas: React.FC<LeanCanvasProps> = (props) => {
  return <BusinessBlueprint {...props} />;
};
