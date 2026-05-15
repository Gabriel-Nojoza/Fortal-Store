"use client"

import { useState } from "react"
import { Upload, X, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const AVAILABLE_SIZES = ["PP", "P", "M", "G", "GG", "XGG"]

interface ProductData {
  name: string
  description: string
  price: number
  imageUrl: string
  sizes: string[]
  team: string
}

interface ProductFormProps {
  onSuccess: () => void
}

export function ProductForm({ onSuccess }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: "",
    team: "",
    price: "",
    description: "",
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size)
        ? prev.filter((s) => s !== size)
        : [...prev, size]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!imageFile || selectedSizes.length === 0) {
      alert("Por favor, adicione uma imagem e selecione pelo menos um tamanho.")
      return
    }

    setIsSubmitting(true)

    try {
      // Upload image first
      const imageFormData = new FormData()
      imageFormData.append("file", imageFile)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: imageFormData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Erro ao fazer upload da imagem")
      }

      const { imageUrl } = await uploadResponse.json()

      // Create product
      const productResponse = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          team: formData.team,
          price: parseFloat(formData.price),
          description: formData.description,
          sizes: selectedSizes,
          imageUrl,
        }),
      })

      if (!productResponse.ok) {
        throw new Error("Erro ao criar produto")
      }

      // Reset form
      setFormData({ name: "", team: "", price: "", description: "" })
      setSelectedSizes([])
      setImagePreview(null)
      setImageFile(null)
      onSuccess()
    } catch (error) {
      console.error("Error:", error)
      alert("Erro ao salvar produto. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Plus className="h-5 w-5 text-primary" />
          Adicionar Novo Produto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-foreground">Imagem do Produto</Label>
            <div className="flex gap-4">
              {imagePreview ? (
                <div className="relative h-40 w-40">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-full w-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null)
                      setImageFile(null)
                    }}
                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label 
                  htmlFor="image-upload"
                  className="flex h-40 w-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary transition-colors hover:border-primary/50"
                >
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Clique para enviar
                  </span>
                </label>
              )}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Name and Team */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Nome do Produto
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Camisa Fortaleza Home 2024"
                className="bg-input"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team" className="text-foreground">
                Time
              </Label>
              <Input
                id="team"
                value={formData.team}
                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                placeholder="Ex: Fortaleza"
                className="bg-input"
                required
              />
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price" className="text-foreground">
              Preço (R$)
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="299.90"
              className="bg-input"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">
              Descrição
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o produto..."
              className="min-h-24 bg-input"
              required
            />
          </div>

          {/* Sizes */}
          <div className="space-y-2">
            <Label className="text-foreground">Tamanhos Disponíveis</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SIZES.map((size) => (
                <Badge
                  key={size}
                  variant={selectedSizes.includes(size) ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    selectedSizes.includes(size)
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => toggleSize(size)}
                >
                  {size}
                </Badge>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Produto
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
