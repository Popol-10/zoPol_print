import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { ProductCategory } from './product-category.enum';

const decimalNumberTransformer = {
  to: (value: number): number => value,
  from: (value: number | string): number => Number(value),
};

@Entity({ name: 'products' })
@Index(['organizationId', 'reference'], { unique: true })
@Index(['organizationId', 'category'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'char', length: 36 })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ length: 160 })
  name: string;

  @Column({ length: 64 })
  reference: string;

  @Column({ type: 'enum', enum: ProductCategory })
  category: ProductCategory;

  @Column({ type: 'decimal', precision: 14, scale: 2, transformer: decimalNumberTransformer })
  price: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, transformer: decimalNumberTransformer })
  cost: number;

  @Column({ name: 'stock_quantity', type: 'int', unsigned: true, default: 0 })
  stock: number;

  @Column({ length: 32, default: 'unité' })
  unit: string;

  @Column({ length: 120 })
  machine: string;

  @Column({ length: 40 })
  duration: string;

  @Column({ type: 'char', length: 7, default: '#fce7f3' })
  color: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', precision: 6, nullable: true })
  deletedAt: Date | null;

  @BeforeInsert()
  @BeforeUpdate()
  normalize(): void {
    this.name = this.name.trim();
    this.reference = this.reference.trim().toUpperCase();
    this.machine = this.machine.trim();
    this.duration = this.duration.trim();
    this.unit = this.unit.trim();
  }
}
