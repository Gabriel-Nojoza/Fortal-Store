"use client"

import { useEffect, useState } from "react"
import { Upload, X, Plus, Loader2, PencilLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/lib/types"

const ADULT_SIZES = ["PP", "P", "M", "G", "GG", "XGG"]
const KIDS_SIZES = [
  "2 anos",
  "3 anos",
  "4 anos",
  "5 anos",
  "6 anos",
  "7 anos",
  "8 anos",
  "9 anos",
  "10 anos",
  "11 anos",
  "12 anos",
]

type SizeProfile = "adult" | "kids"

interface ProductFormState {
  name: string
  description: string
  price: string
  team: string
}

interface ProductFormProps {
  onSuccess: () => void
  productToEdit?: Product | null
  onCancelEdit?: () => void
}

const emptyFormState: ProductFormState = {
  name: "",
  team: "",
  price: "",
  description: "",
}

function inferSizeProfile(sizes: string[]): SizeProfile {
  return sizes.length > 0 && sizes.every((size) => KIDS_SIZES.includes(size))
    ? "kids"
    : "adult"
}

export function ProductForm({
  onSuccess,
  productToEdit = null,
  onCancelEdit,
}: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [sizeProfile, setSizeProfile] = useState<SizeProfile>("adult")
  const [formData, setFormData] = useState<ProductFormState>(emptyFormState)

  const isEditing = Boolean(productToEdit)
  const availableSizes = sizeProfile === "kids" ? KIDS_SIZES : ADULT_SIZES

  useEffect(() => {
    if (!productToEdit) {
      setFormData(emptyFormState)
      setSelectedSizes([])
      setSizeProfile("adult")
      setImagePreview(null)
      setImageFile(null)
      return
    }

    setFormData({
      name: productToEdit.name,
      team: productToEdit.team,
      price: String(productToEdit.price),
      description: productToEdit.description,
    })
    setSizeProfile(inferSizeProfile(productToEdit.sizes))
    setSelectedSizes(productToEdit.sizes)
    setImagePreview(productToEdit.imageUrl)
    setImageFile(null)
  }, [productToEdit])

  const resetForm = () => {
    setFormData(emptyFormState)
    setSelectedSizes([])
    setSizeProfile("adult")
    setImagePreview(null)
    setImageFile(null)
  }

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
        ? prev.filter((selectedSize) => selectedSize !== size)
        : [...prev, size]
    )
  }

  const handleSizeProfileChange = (nextProfile: SizeProfile) => {
    setSizeProfile(nextProfile)
    const validSizes = nextProfile === "kids" ? KIDS_SIZES : ADULT_SIZES
    setSelectedSizes((currentSizes) =>
      currentSizes.filter((size) => validSizes.includes(size))
    )
  }

  const handleCancelEdit = () => {
    resetForm()
    onCancelEdit?.()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!imagePreview || selectedSizes.length === 0) {
      alert("Por favor, adicione uma imagem e selecione pelo menos um tamanho.")
      return
    }

    setIsSubmitting(true)

    try {
      let imageUrl = imagePreview

      if (imageFile) {
        const imageFormData = new FormData()
        imageFormData.append("file", imageFile)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: imageFormData,
        })

        if (!uploadResponse.ok) {
          const payload = await uploadResponse.json().catch(() => null)
          throw new Error(payload?.error || "Erro ao fazer upload da imagem")
        }

        const uploadPayload = await uploadResponse.json()
        imageUrl = uploadPayload.imageUrl
      }

      const productPayload = {
        name: formData.name,
        team: formData.team,
        price: parseFloat(formData.price),
        description: formData.description,
        sizes: selectedSizes,
        imageUrl,
      }

      const endpoint = isEditing
        ? `/api/products/${productToEdit?.id}`
        : "/api/products"

      const productResponse = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productPayload),
      })

      if (!productResponse.ok) {
        const payload = await productResponse.json().catch(() => null)
        throw new Error(
          payload?.error ||
            (isEditing ? "Erro ao atualizar produto" : "Erro ao criar produto")
        )
      }

      resetForm()
      onCancelEdit?.()
      onSuccess()
    } catch (error) {
      console.error("Error:", error)
      alert(
        error instanceof Error
          ? error.message
          : "Erro ao salvar produto. Tente novamente."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          {isEditing ? (
            <PencilLine className="h-5 w-5 text-primary" />
          ) : (
            <Plus className="h-5 w-5 text-primary" />
          )}
          {isEditing ? "Editar Produto" : "Adicionar Novo Produto"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {isEditing ? (
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              Ajuste os dados do produto e salve novamente. A imagem atual sera
              mantida se voce nao escolher outra.
            </div>
          ) : null}

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
                  <span className="text-center text-xs text-muted-foreground">
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Nome do Produto
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, team: e.target.value })
                }
                placeholder="Ex: Fortaleza"
                className="bg-input"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="text-foreground">
              Preco (R$)
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              placeholder="299.90"
              className="bg-input"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">
              Descricao
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Descreva o produto..."
              className="min-h-24 bg-input"
              required
            />
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-foreground">Grade de Tamanhos</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={sizeProfile === "adult" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSizeProfileChange("adult")}
                >
                  Adulto
                </Button>
                <Button
                  type="button"
                  variant={sizeProfile === "kids" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSizeProfileChange("kids")}
                >
                  Infantil
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">
                {sizeProfile === "kids"
                  ? "Tamanhos Infantis"
                  : "Tamanhos Disponiveis"}
              </Label>
              {sizeProfile === "kids" ? (
                <p className="text-xs text-muted-foreground">
                  Selecione os tamanhos de 2 a 12 anos disponiveis para esse
                  modelo.
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size) => (
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

          <div className="flex flex-col gap-3 sm:flex-row">
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
              ) : isEditing ? (
                <>
                  <PencilLine className="mr-2 h-4 w-4" />
                  Salvar Alteracoes
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Produto
                </>
              )}
            </Button>

            {isEditing ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleCancelEdit}
                disabled={isSubmitting}
              >
                Cancelar Edicao
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
