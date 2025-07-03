<template>
  <v-container fluid class="pa-4">
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-6">
          <h2 class="text-h4">Gestion des étudiants</h2>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddStudentDialog">
            Ajouter un étudiant
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card class="rounded-lg">
          <v-card-text>
            <!-- Filtres et recherche -->
            <v-row class="mb-4">
              <v-col cols="12" sm="6" md="4">
                <v-text-field
                  v-model="search"
                  label="Rechercher un étudiant"
                  prepend-inner-icon="mdi-magnify"
                  density="comfortable"
                  hide-details
                  variant="outlined"
                  @input="filterStudents"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-select
                  v-model="selectedYear"
                  :items="years"
                  label="Année"
                  density="comfortable"
                  hide-details
                  variant="outlined"
                  @update:model-value="filterStudents"
                ></v-select>
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-select
                  v-model="selectedGroup"
                  :items="groups"
                  label="Groupe"
                  density="comfortable"
                  hide-details
                  variant="outlined"
                  @update:model-value="filterStudents"
                ></v-select>
              </v-col>
            </v-row>

            <!-- Table des étudiants -->
            <v-data-table
              :headers="headers"
              :items="filteredStudents"
              :items-per-page="10"
              class="elevation-1 rounded-lg"
              :loading="loading"
            >
              <template v-slot:item.actions="{ item }">
                <v-btn icon variant="text" color="primary" @click="editStudent(item)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon variant="text" color="error" @click="confirmDelete(item)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog d'ajout/modification d'étudiant -->
    <v-dialog v-model="dialogOpen" max-width="600px">
      <v-card>
        <v-card-title>{{ isEditing ? 'Modifier l\'étudiant' : 'Ajouter un étudiant' }}</v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="formValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="student.firstName"
                  label="Prénom"
                  required
                  :rules="[v => !!v || 'Le prénom est requis']"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="student.lastName"
                  label="Nom"
                  required
                  :rules="[v => !!v || 'Le nom est requis']"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="student.year"
                  :items="years"
                  label="Année"
                  required
                  :rules="[v => !!v || 'L\'année est requise']"
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="student.group"
                  :items="groups"
                  label="Groupe"
                  required
                  :rules="[v => !!v || 'Le groupe est requis']"
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-checkbox
                  v-model="student.isGroup"
                  label="Est un groupe"
                ></v-checkbox>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="student.studentNumber"
                  label="Numéro étudiant"
                  required
                  :rules="[v => !!v || 'Le numéro étudiant est requis']"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" text @click="dialogOpen = false">Annuler</v-btn>
          <v-btn color="primary" @click="saveStudent" :disabled="!formValid">Enregistrer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de confirmation de suppression -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">Confirmation de suppression</v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer cet étudiant ? Cette action est irréversible.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" text @click="deleteDialog = false">Annuler</v-btn>
          <v-btn color="error" @click="deleteStudent">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar de notification -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="5000">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Fermer</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

// État de la page
const loading = ref(false);
const students = ref([]);
const filteredStudents = ref([]);
const search = ref('');
const selectedYear = ref(null);
const selectedGroup = ref(null);

// Liste des années et groupes
const years = ref(['BUT1', 'BUT2', 'BUT3', 'LP', 'Master 1', 'Master 2']);
const groups = ref(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

// Modèle étudiant
const student = ref({
  firstName: '',
  lastName: '',
  year: '',
  group: '',
  isGroup: false,
  studentNumber: ''
});

// En-têtes du tableau
const headers = ref([
  { title: 'Nom', align: 'start', key: 'lastName' },
  { title: 'Prénom', align: 'start', key: 'firstName' },
  { title: 'Année', align: 'start', key: 'year' },
  { title: 'Groupe', align: 'start', key: 'group' },
  { title: 'Numéro étudiant', align: 'start', key: 'studentNumber' },
  { title: 'Est un groupe', align: 'start', key: 'isGroup' },
  { title: 'Actions', align: 'end', key: 'actions', sortable: false }
]);

// Formulaire et dialogue
const dialogOpen = ref(false);
const isEditing = ref(false);
const formValid = ref(false);
const deleteDialog = ref(false);
const studentToDelete = ref(null);

// Notifications
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
});

// Chargement des données au montage du composant
onMounted(async () => {
  await loadStudents();
});

// Méthodes
const loadStudents = async () => {
  loading.value = true;
  try {
    const queryParams = new URLSearchParams();
    if (selectedYear.value) queryParams.append('year', selectedYear.value);
    if (selectedGroup.value) queryParams.append('group', selectedGroup.value);

    const response = await fetch(`http://localhost:5000/api/students/list?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des étudiants');
    }

    const data = await response.json();
    students.value = data;
    filteredStudents.value = data;
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors du chargement des étudiants',
      color: 'error'
    };
  } finally {
    loading.value = false;
  }
};

const filterStudents = () => {
  filteredStudents.value = students.value.filter(student => {
    const matchesSearch = search.value === '' || 
      student.firstName.toLowerCase().includes(search.value.toLowerCase()) ||
      student.lastName.toLowerCase().includes(search.value.toLowerCase()) ||
      student.studentNumber.toLowerCase().includes(search.value.toLowerCase());
      
    const matchesYear = selectedYear.value === null || 
      student.year === selectedYear.value;
      
    const matchesGroup = selectedGroup.value === null || 
      student.group === selectedGroup.value;
      
    return matchesSearch && matchesYear && matchesGroup;
  });
};

const editStudent = (item) => {
  isEditing.value = true;
  student.value = { ...item };
  dialogOpen.value = true;
};

const confirmDelete = (item) => {
  studentToDelete.value = item;
  deleteDialog.value = true;
};

const saveStudent = async () => {
  try {
    const url = isEditing.value
      ? `http://localhost:5000/api/students/update/${student.value._id}`
      : 'http://localhost:5000/api/students/add';

    const method = isEditing.value ? 'PUT' : 'POST';

    // Préparer les données pour correspondre au schéma backend
    const studentData = {
      firstName: student.value.firstName,
      lastName: student.value.lastName,
      year: student.value.year,
      group: student.value.group,
      isGroup: student.value.isGroup,
      studentNumber: student.value.studentNumber
    };

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(studentData)
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de l'${isEditing.value ? 'édition' : 'ajout'} de l'étudiant`);
    }

    snackbar.value = {
      show: true,
      text: `Étudiant ${isEditing.value ? 'modifié' : 'ajouté'} avec succès`,
      color: 'success'
    };

    dialogOpen.value = false;
    await loadStudents();
    resetForm();
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: `Erreur lors de l'${isEditing.value ? 'édition' : 'ajout'} de l'étudiant`,
      color: 'error'
    };
  }
};

const deleteStudent = async () => {
  if (!studentToDelete.value) return;

  try {
    const response = await fetch(`http://localhost:5000/api/students/delete/${studentToDelete.value._id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la suppression de l\'étudiant');
    }

    snackbar.value = {
      show: true,
      text: 'Étudiant supprimé avec succès',
      color: 'success'
    };

    deleteDialog.value = false;
    await loadStudents();
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors de la suppression de l\'étudiant',
      color: 'error'
    };
  }
};

const searchStudentByNumber = async (studentNumber) => {
  try {
    const response = await fetch(`http://localhost:5000/api/students/search/${studentNumber}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la recherche de l\'étudiant');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors de la recherche de l\'étudiant',
      color: 'error'
    };
  }
};

const resetForm = () => {
  student.value = {
    firstName: '',
    lastName: '',
    year: '',
    group: '',
    isGroup: false,
    studentNumber: ''
  };
  isEditing.value = false;
};

const openAddStudentDialog = () => {
  resetForm();
  dialogOpen.value = true;
};
</script>

<style scoped>
/* Styles supplémentaires si nécessaires */
</style>
