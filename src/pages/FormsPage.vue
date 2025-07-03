<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card class="pa-4">
          <v-card-title>Formulaires d'évaluation</v-card-title>
          <v-card-text>
            <!-- Search and Filter -->
            <v-row class="mb-4">
              <v-col cols="12" sm="6" md="4">
                <v-text-field
                  v-model="search"
                  label="Rechercher un formulaire"
                  prepend-inner-icon="mdi-magnify"
                  density="comfortable"
                  hide-details
                  variant="outlined"
                  @input="filterForms"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-text-field
                  v-model="filterValidFrom"
                  label="Valide à partir de"
                  type="date"
                  density="comfortable"
                  hide-details
                  variant="outlined"
                  @input="filterForms"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-text-field
                  v-model="filterValidTo"
                  label="Valide jusqu'à"
                  type="date"
                  density="comfortable"
                  hide-details
                  variant="outlined"
                  @input="filterForms"
                ></v-text-field>
              </v-col>
            </v-row>

            <!-- Data Table -->
            <v-data-table
              :headers="headers"
              :items="filteredForms"
              :items-per-page="10"
              class="elevation-1 rounded-lg"
              :loading="loading"
            >
              <template v-slot:item.actions="{ item }">
                <v-btn icon variant="text" color="primary" @click="editForm(item)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon variant="text" color="error" @click="confirmDeleteForm(item)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog -->
    <v-dialog v-model="dialog" max-width="800px">
      <v-card>
        <v-card-title>
          <span class="headline">{{ dialogTitle }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="formRef" v-model="formIsValid">
            <v-text-field v-model="form.title" label="Titre du formulaire" />

            <v-select
              v-model="form.associationType"
              :items="['student', 'group']"
              label="Type d'association"
            />

            <v-text-field
              v-model="form.professor"
              label="ID du professeur"
            />

            <!-- Champs simplifiés pour les dates -->
            <v-text-field
              v-model="form.validFrom"
              label="Valide à partir de"
              type="date"
            />

            <v-text-field
              v-model="form.validTo"
              label="Valide jusqu'à"
              type="date"
            />

            <v-expansion-panels v-model="expanded">
              <v-expansion-panel
                v-for="(section, index) in form.sections"
                :key="index"
              >
                <v-expansion-panel-header>
                  {{ section.title || 'Nouvelle section' }}
                </v-expansion-panel-header>
                <v-expansion-panel-content>
                  <v-text-field
                    v-model="section.title"
                    label="Titre de la section"
                  />

                  <v-btn @click="addLine(section)">Ajouter une ligne</v-btn>

                  <v-row
                    v-for="(line, lineIndex) in section.lines"
                    :key="lineIndex"
                  >
                    <v-col cols="6">
                      <v-text-field
                        v-model="line.title"
                        label="Titre de la ligne"
                      />
                    </v-col>
                    <v-col cols="3">
                      <v-select
                        v-model="line.type"
                        :items="['binary', 'scale']"
                        label="Type"
                      />
                    </v-col>
                    <v-col cols="3">
                      <v-text-field
                        v-model.number="line.maxScore"
                        label="Score max"
                        type="number"
                      />
                    </v-col>
                  </v-row>
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-expansion-panels>

            <v-btn class="mt-2" @click="addSection">Ajouter une section</v-btn>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeDialog">Annuler</v-btn>
          <v-btn color="primary" text @click="submitForm">Enregistrer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">Confirmation de suppression</v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer ce formulaire ? Cette action est irréversible.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" text @click="deleteDialog = false">Annuler</v-btn>
          <v-btn color="error" @click="deleteForm">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="5000">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Fermer</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const forms = ref([]);
const headers = [
  { text: 'Titre', value: 'title' },
  { text: "Type d'association", value: 'associationType' },
  { text: 'Valide à partir de', value: 'validFrom' },
  { text: 'Valide jusqu\'à', value: 'validTo' },
  { text: 'Actions', value: 'actions', sortable: false },
];

const dialog = ref(false);
const deleteDialog = ref(false);
const snackbar = ref({ show: false, text: '', color: 'success' });
const formToDelete = ref(null);
const dialogTitle = ref('Ajouter un formulaire');
const form = ref({
  id: null,
  professor: '',
  title: '',
  associationType: '',
  students: [],
  groupCount: 0,
  sections: [],
  validFrom: '',
  validTo: '',
});
const expanded = ref([]);
const formRef = ref(null);
const formIsValid = ref(false);
const search = ref('');
const filterValidFrom = ref('');
const filterValidTo = ref('');
const filteredForms = ref([]);
const loading = ref(false);

// Règles de validation (non utilisées ici mais disponibles)
const rules = {
  required: v => !!v || 'Ce champ est requis',
  isNumber: v => !isNaN(parseFloat(v)) || 'Doit être un nombre',
};

const openDialog = () => {
  dialog.value = true;
  dialogTitle.value = 'Ajouter un formulaire';
  resetForm();
};

const closeDialog = () => {
  dialog.value = false;
};

const resetForm = () => {
  form.value = {
    id: null,
    professor: '',
    title: '',
    associationType: '',
    students: [],
    groupCount: 0,
    sections: [],
    validFrom: '',
    validTo: '',
  };
};

const submitForm = async () => {
  try {
    const payload = {
      professor: form.value.professor,
      title: form.value.title,
      associationType: form.value.associationType,
      students: form.value.students,
      groupCount: form.value.groupCount,
      sections: form.value.sections.map(section => ({
        title: section.title,
        lines: section.lines.map(line => ({
          title: line.title,
          maxScore: line.maxScore,
          type: line.type,
        })),
      })),
      validFrom: form.value.validFrom,
      validTo: form.value.validTo,
    };

    const url = form.value.id 
      ? `http://localhost:5000/api/forms/update/${form.value.id}` 
      : 'http://localhost:5000/api/forms/add';
    
    const method = form.value.id ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de ${form.value.id ? 'la modification' : 'l\'ajout'} du formulaire`);
    }

    fetchForms();
    closeDialog();
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du formulaire :', error);
  }
};

const editForm = (formToEdit) => {
  dialog.value = true;
  dialogTitle.value = 'Modifier un formulaire';
  form.value = JSON.parse(JSON.stringify(formToEdit));
};

const confirmDeleteForm = (form) => {
  formToDelete.value = form;
  deleteDialog.value = true;
};

const deleteForm = async () => {
  if (!formToDelete.value || !formToDelete.value._id) {
    snackbar.value = {
      show: true,
      text: 'Erreur : Aucun formulaire valide à supprimer.',
      color: 'error'
    };
    deleteDialog.value = false;
    return;
  }

  try {
    const response = await fetch(`http://localhost:5000/api/forms/delete/${formToDelete.value._id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la suppression du formulaire');
    }

    snackbar.value = {
      show: true,
      text: 'Formulaire supprimé avec succès',
      color: 'success'
    };

    deleteDialog.value = false;
    fetchForms();
  } catch (error) {
    snackbar.value = {
      show: true,
      text: 'Erreur lors de la suppression du formulaire',
      color: 'error'
    };
  }
};

const exportForm = async (id) => {
  try {
    const response = await fetch(`http://localhost:5000/api/forms/export/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de l\'exportation du formulaire');
    }
    
    const data = await response.text();
    const blob = new Blob([data], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `form_${id}.csv`;
    link.click();
  } catch (error) {
    console.error(error);
  }
};

const fetchForms = async () => {
  loading.value = true;
  try {
    const response = await fetch('http://localhost:5000/api/forms/list', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors du chargement des formulaires');
    }
    
    const data = await response.json();
    forms.value = data;
    filteredForms.value = data; // Initialize filteredForms
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const addSection = () => {
  form.value.sections.push({ title: '', lines: [] });
};

const addLine = (section) => {
  section.lines.push({ title: '', type: 'binary', maxScore: 0 });
};

const filterForms = () => {
  filteredForms.value = forms.value.filter(form => {
    const matchesSearch = search.value === '' || 
      form.title.toLowerCase().includes(search.value.toLowerCase()) ||
      form.associationType.toLowerCase().includes(search.value.toLowerCase());

    const matchesValidFrom = filterValidFrom.value === '' || 
      new Date(form.validFrom) >= new Date(filterValidFrom.value);

    const matchesValidTo = filterValidTo.value === '' || 
      new Date(form.validTo) <= new Date(filterValidTo.value);

    return matchesSearch && matchesValidFrom && matchesValidTo;
  });
};

onMounted(() => {
  fetchForms();
});
</script>
