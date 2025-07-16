<template>
  <v-container fluid class="pa-4">
    <!-- En-tête modernisé -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold mb-2">
              <v-icon size="large" color="primary" class="mr-3">
                mdi-clipboard-check
              </v-icon>
              Gestion des évaluations
            </h1>
            <p class="text-subtitle-1 text-medium-emphasis">
              Créez et gérez vos évaluations basées sur les formulaires
            </p>
          </div>
          <div class="d-flex gap-2">
            <v-btn
              color="success"
              variant="outlined"
              prepend-icon="mdi-download"
              @click="exportAllEvaluations"
              :disabled="filteredEvaluations.length === 0"
            >
              Exporter tout
            </v-btn>
            <v-btn
              color="primary"
              size="large"
              @click="openNewEvaluationDialog"
              prepend-icon="mdi-plus"
              variant="elevated"
              class="text-h6"
            >
              Nouvelle évaluation
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card class="rounded-lg elevation-3" color="surface">
          <v-card-text class="pa-6">
            <!-- Filtres et recherche -->
            <v-row class="mb-6" align="center">
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="search"
                  label="Rechercher une évaluation"
                  placeholder="Formulaire, étudiant..."
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  @input="filterEvaluations"
                  clearable
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="selectedForm"
                  :items="formOptions"
                  label="Filtrer par formulaire"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  prepend-inner-icon="mdi-clipboard-text"
                  @update:model-value="filterEvaluations"
                  clearable
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="selectedPromotion"
                  :items="promotionOptions"
                  label="Filtrer par promotion"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  prepend-inner-icon="mdi-school"
                  @update:model-value="filterEvaluations"
                  clearable
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="selectedGroup"
                  :items="groupOptions"
                  label="Filtrer par groupe"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  prepend-inner-icon="mdi-account-group"
                  @update:model-value="filterEvaluations"
                  clearable
                />
              </v-col>
            </v-row>

            <!-- Tableau des évaluations -->
            <v-data-table
              :headers="headers"
              :items="filteredEvaluations"
              :items-per-page="pagination.limit"
              :page="pagination.page"
              :server-items-length="pagination.total"
              class="elevation-1 rounded-lg"
              :loading="loading"
              loading-text="Chargement des évaluations..."
              no-data-text="Aucune évaluation trouvée"
              items-per-page-text="Évaluations par page"
              @update:options="handleTableOptions"
            >
              <!-- Formulaire -->
              <template v-slot:item.form="{ item }">
                <div class="d-flex align-center">
                  <v-avatar color="primary" size="32" class="mr-3">
                    <v-icon color="white">mdi-clipboard-text</v-icon>
                  </v-avatar>
                  <div>
                    <div class="font-weight-medium">{{ item.form?.title }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ item.form?.associationType === 'student' ? 'Individuelle' : 'Groupe' }}
                    </div>
                  </div>
                </div>
              </template>

              <!-- Cible de l'évaluation -->
              <template v-slot:item.target="{ item }">
                <div v-if="item.student">
                  <v-chip
                    color="green"
                    size="small"
                    variant="flat"
                    prepend-icon="mdi-account"
                    class="font-weight-medium"
                  >
                    {{ item.student.firstName }} {{ item.student.lastName }}
                  </v-chip>
                  <div class="text-caption text-medium-emphasis mt-1">
                    N° {{ item.student.studentNumber }}
                  </div>
                </div>
                <div v-else>
                  <v-chip
                    color="blue"
                    size="small"
                    variant="flat"
                    prepend-icon="mdi-account-group"
                    class="font-weight-medium"
                  >
                    Groupe {{ item.groupNumber }}
                  </v-chip>
                </div>
              </template>

              <!-- Promotion/Groupe -->
              <template v-slot:item.context="{ item }">
                <div>
                  <div v-if="item.promotion" class="text-body-2">
                    <v-icon size="small" class="mr-1">mdi-school</v-icon>
                    {{ item.promotion.name }} {{ item.promotion.year }}
                  </div>
                  <div v-if="item.group" class="text-caption text-medium-emphasis">
                    <v-icon size="small" class="mr-1">mdi-account-group</v-icon>
                    {{ item.group.name }}
                  </div>
                </div>
              </template>

              <!-- Scores -->
              <template v-slot:item.scores="{ item }">
                <div class="d-flex align-center">
                  <v-progress-circular
                    :model-value="getScorePercentage(item)"
                    :color="getScoreColor(item)"
                    :size="32"
                    :width="3"
                    class="mr-2"
                  >
                    <span class="text-caption">{{ item.scores?.length || 0 }}</span>
                  </v-progress-circular>
                  <div>
                    <div class="text-body-2">{{ item.scores?.length || 0 }} critères</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ getScorePercentage(item) }}% complété
                    </div>
                  </div>
                </div>
              </template>

              <!-- Professeur -->
              <template v-slot:item.professor="{ item }">
                <div class="d-flex align-center">
                  <v-icon size="small" color="primary" class="mr-2">mdi-account-tie</v-icon>
                  <span>{{ item.professor?.firstName }} {{ item.professor?.lastName }}</span>
                </div>
              </template>

              <!-- Date de création -->
              <template v-slot:item.createdAt="{ item }">
                <div class="text-caption">
                  {{ formatDate(item.createdAt) }}
                </div>
              </template>

              <!-- Actions -->
              <template v-slot:item.actions="{ item }">
                <div class="d-flex gap-1">
                  <v-btn
                    icon="mdi-eye"
                    variant="text"
                    color="info"
                    size="small"
                    @click="viewEvaluation(item)"
                  >
                    <v-icon size="small">mdi-eye</v-icon>
                    <v-tooltip activator="parent" location="top">Voir les détails</v-tooltip>
                  </v-btn>
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    color="primary"
                    size="small"
                    @click="editEvaluation(item)"
                  >
                    <v-icon size="small">mdi-pencil</v-icon>
                    <v-tooltip activator="parent" location="top">Modifier</v-tooltip>
                  </v-btn>
                  <v-btn
                    icon="mdi-download"
                    variant="text"
                    color="success"
                    size="small"
                    @click="exportEvaluation(item)"
                  >
                    <v-icon size="small">mdi-download</v-icon>
                    <v-tooltip activator="parent" location="top">Exporter</v-tooltip>
                  </v-btn>
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    size="small"
                    @click="confirmDeleteEvaluation(item)"
                  >
                    <v-icon size="small">mdi-delete</v-icon>
                    <v-tooltip activator="parent" location="top">Supprimer</v-tooltip>
                  </v-btn>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog de sélection de formulaire -->
    <v-dialog v-model="selectFormDialog" max-width="700px">
      <v-card class="rounded-lg">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center">
            <v-icon size="large" color="primary" class="mr-3">
              mdi-clipboard-plus
            </v-icon>
            <div>
              <h3 class="text-h5 font-weight-bold">Sélectionner un formulaire</h3>
              <p class="text-subtitle-1 text-medium-emphasis mb-0">
                Choisissez un formulaire pour créer une nouvelle évaluation
              </p>
            </div>
          </div>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-6">
          <v-text-field
            v-model="searchForms"
            label="Rechercher un formulaire"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            hide-details
            class="mb-4"
            clearable
          />
          
          <div v-if="loadingForms" class="text-center pa-8">
            <v-progress-circular indeterminate color="primary" size="48" />
            <div class="text-h6 mt-4">Chargement des formulaires...</div>
          </div>
          
          <v-list v-else-if="filteredValidForms.length > 0" class="rounded">
            <v-list-item
              v-for="form in filteredValidForms"
              :key="form._id"
              @click="selectForm(form)"
              class="mb-2 pa-4"
              variant="outlined"
              rounded
            >
              <template v-slot:prepend>
                <v-avatar color="primary" size="40">
                  <v-icon color="white">mdi-clipboard-text</v-icon>
                </v-avatar>
              </template>
              
              <v-list-item-title class="font-weight-medium mb-1">
                {{ form.title }}
              </v-list-item-title>
              
              <v-list-item-subtitle class="mb-2">
                {{ form.associationType === 'student' ? 'Évaluation individuelle' : 'Évaluation par groupe' }}
                • Valide jusqu'au {{ formatDate(form.validTo) }}
              </v-list-item-subtitle>
              
              <div class="d-flex align-center gap-2">
                <v-chip size="small" color="success" variant="flat">
                  {{ getFormStatus(form) }}
                </v-chip>
                <v-chip size="small" color="info" variant="outlined">
                  {{ form.sections?.length || 0 }} section{{ (form.sections?.length || 0) > 1 ? 's' : '' }}
                </v-chip>
              </div>
              
              <template v-slot:append>
                <v-icon color="primary">mdi-chevron-right</v-icon>
              </template>
            </v-list-item>
          </v-list>
          
          <div v-else class="text-center pa-8">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-clipboard-remove</v-icon>
            <div class="text-h6 mb-2">Aucun formulaire disponible</div>
            <div class="text-body-2 text-medium-emphasis">
              {{ searchForms ? 'Aucun formulaire ne correspond à votre recherche' : 'Aucun formulaire n\'est disponible pour évaluation actuellement' }}
            </div>
          </div>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions class="pa-6">
          <v-spacer />
          <v-btn 
            color="grey-darken-1" 
            variant="text"
            @click="selectFormDialog = false"
            prepend-icon="mdi-close"
          >
            Annuler
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog d'évaluation -->
    <v-dialog v-model="evaluationDialog" max-width="1000px" persistent>
      <v-card v-if="selectedFormData" class="rounded-lg">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center">
            <v-icon size="large" color="primary" class="mr-3">
              {{ currentEvaluation._id ? 'mdi-clipboard-edit' : 'mdi-clipboard-plus' }}
            </v-icon>
            <div>
              <h3 class="text-h5 font-weight-bold">
                {{ currentEvaluation._id ? 'Modifier' : 'Nouvelle' }} évaluation
              </h3>
              <p class="text-subtitle-1 text-medium-emphasis mb-0">
                {{ selectedFormData.title }}
                <v-chip v-if="selectedFormData.students && selectedFormData.students.length > 0" 
                       size="small" 
                       color="info" 
                       variant="outlined" 
                       class="ml-2">
                  {{ selectedFormData.students.length }} étudiant(s) assigné(s)
                </v-chip>
              </p>
            </div>
          </div>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-6" style="max-height: 70vh; overflow-y: auto;">
          <v-form ref="evaluationFormRef" v-model="evaluationFormValid">
            <!-- Informations de l'évaluation -->
            <v-row class="mb-6">
              <v-col cols="12">
                <h4 class="text-h6 font-weight-medium mb-3">
                  <v-icon color="primary" class="mr-2">mdi-information</v-icon>
                  Informations de l'évaluation
                </h4>
              </v-col>
              
              <v-col cols="12" md="6" v-if="selectedFormData.associationType === 'student'">
                <v-select
                  v-model="currentEvaluation.student"
                  :items="studentsForEvaluation"
                  label="Étudiant à évaluer"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  density="comfortable"
                  item-title="fullName"
                  item-value="_id"
                  :rules="[rules.required]"
                  required
                  :loading="loadingForms"
                  :disabled="studentsForEvaluation.length === 0"
                  :hint="getStudentSelectHint()"
                  persistent-hint
                >
                  <template v-slot:append-inner v-if="studentsForEvaluation.length === 0">
                    <v-btn
                      icon="mdi-refresh"
                      variant="text"
                      size="small"
                      @click="loadStudents"
                      :loading="loading"
                    >
                      <v-icon size="small">mdi-refresh</v-icon>
                      <v-tooltip activator="parent" location="top">Recharger les étudiants</v-tooltip>
                    </v-btn>
                  </template>
                </v-select>
              </v-col>
              
              <v-col cols="12" md="6" v-if="selectedFormData.associationType === 'group'">
                <v-select
                  v-model="currentEvaluation.group"
                  :items="groupsForEvaluation"
                  label="Groupe à évaluer"
                  prepend-inner-icon="mdi-account-group"
                  variant="outlined"
                  density="comfortable"
                  item-title="name"
                  item-value="_id"
                  :rules="[rules.required]"
                  required
                  :loading="loadingForms"
                  :disabled="groupsForEvaluation.length === 0"
                  hint="Sélectionnez le groupe assigné à ce formulaire"
                  persistent-hint
                >
                  <template v-slot:append-inner v-if="groupsForEvaluation.length === 0">
                    <v-btn
                      icon="mdi-refresh"
                      variant="text"
                      size="small"
                      @click="loadGroups"
                      :loading="loading"
                    >
                      <v-icon size="small">mdi-refresh</v-icon>
                      <v-tooltip activator="parent" location="top">Recharger les groupes</v-tooltip>
                    </v-btn>
                  </template>
                </v-select>
              </v-col>
              
              <v-col cols="12" md="6" v-if="selectedFormData.associationType === 'subgroup'">
                <v-select
                  v-model="currentEvaluation.subgroup"
                  :items="subgroupsForEvaluation"
                  label="Sous-groupe à évaluer"
                  prepend-inner-icon="mdi-account-group-outline"
                  variant="outlined"
                  density="comfortable"
                  item-title="name"
                  item-value="_id"
                  :rules="[rules.required]"
                  required
                  :loading="loadingForms"
                  :disabled="subgroupsForEvaluation.length === 0"
                  hint="Sélectionnez le sous-groupe assigné à ce formulaire"
                  persistent-hint
                >
                  <template v-slot:append-inner v-if="subgroupsForEvaluation.length === 0">
                    <v-btn
                      icon="mdi-refresh"
                      variant="text"
                      size="small"
                      @click="loadSubgroups"
                      :loading="loading"
                    >
                      <v-icon size="small">mdi-refresh</v-icon>
                      <v-tooltip activator="parent" location="top">Recharger les sous-groupes</v-tooltip>
                    </v-btn>
                  </template>
                </v-select>
              </v-col>
              
              <v-col cols="12" md="6" v-if="selectedFormData.associationType === 'promotion'">
                <v-select
                  v-model="currentEvaluation.promotion"
                  :items="promotionForEvaluation ? [promotionForEvaluation] : []"
                  label="Promotion à évaluer"
                  prepend-inner-icon="mdi-school"
                  variant="outlined"
                  density="comfortable"
                  item-title="displayName"
                  item-value="_id"
                  :rules="[rules.required]"
                  required
                  :loading="loadingForms"
                  :disabled="!promotionForEvaluation"
                  hint="Promotion assignée à ce formulaire"
                  persistent-hint
                >
                </v-select>
              </v-col>
            </v-row>

            <!-- Sections d'évaluation -->
            <div v-if="hasValidTarget && selectedFormData?.sections">
              <h4 class="text-h6 font-weight-medium mb-3">
                <v-icon color="primary" class="mr-2">mdi-clipboard-check</v-icon>
                Critères d'évaluation
              </h4>
              
              <v-expansion-panels v-model="expandedSections" multiple variant="accordion">
                <v-expansion-panel
                  v-for="(section, sectionIndex) in selectedFormData.sections"
                  :key="sectionIndex"
                  class="mb-2"
                >
                  <v-expansion-panel-title>
                    <div class="d-flex align-center w-100">
                      <v-icon class="mr-3">mdi-folder-outline</v-icon>
                      <div class="flex-grow-1">
                        <div class="font-weight-medium">{{ section?.title || 'Section sans titre' }}</div>
                        <div class="text-caption text-medium-emphasis">
                          {{ section?.lines?.length || 0 }} critère{{ (section?.lines?.length || 0) > 1 ? 's' : '' }}
                        </div>
                      </div>
                      <v-chip size="small" :color="getSectionCompletionColor(sectionIndex)" variant="flat">
                        {{ getCompletedCriteria(sectionIndex) }}/{{ section?.lines?.length || 0 }}
                      </v-chip>
                    </div>
                  </v-expansion-panel-title>
                  
                  <v-expansion-panel-text>
                    <v-row v-if="section?.lines && section.lines.length > 0">
                      <v-col
                        v-for="(line, lineIndex) in section.lines"
                        :key="lineIndex"
                        cols="12"
                        md="6"
                      >
                        <v-card v-if="line && line._id && line.title" variant="outlined" class="pa-4">
                          <div class="text-subtitle-2 mb-3 font-weight-medium">
                            {{ line.title }}
                          </div>
                          
                          <div class="mb-3">
                            <v-chip size="small" :color="line.type === 'binary' ? 'orange' : 'blue'" variant="outlined">
                              {{ line.type === 'binary' ? 'Oui/Non' : 'Échelle 0-8' }}
                            </v-chip>
                            <v-chip size="small" color="grey" variant="outlined" class="ml-1">
                              Max: {{ line.maxScore }}
                            </v-chip>
                          </div>
                          
                          <!-- Notation binaire -->
                          <div v-if="line.type === 'binary'">
                            <!-- Notation commune -->
                            <div v-if="line.notationType === 'common'">
                              <v-radio-group
                                v-model="currentEvaluation.scores[line._id].commonScore"
                                inline
                                hide-details
                              >
                                <v-radio label="Non" :value="0" color="error" />
                                <v-radio label="Oui" :value="1" color="success" />
                              </v-radio-group>
                            </div>
                            
                            <!-- Notation individuelle -->
                            <div v-else-if="line.notationType === 'individual'">
                              <div v-for="student in getTargetStudents()" :key="student?._id || `student-${student?.firstName}-${student?.lastName}`" class="mb-2">
                                <div class="text-caption mb-1">{{ student?.firstName || 'Prénom' }} {{ student?.lastName || 'Nom' }}</div>
                                <v-radio-group
                                  :model-value="getIndividualScore(line._id, student?._id)"
                                  @update:model-value="(value) => setIndividualScore(line._id, student?._id, value)"
                                  inline
                                  hide-details
                                >
                                  <v-radio label="Non" :value="0" color="error" />
                                  <v-radio label="Oui" :value="1" color="success" />
                                </v-radio-group>
                              </div>
                            </div>
                            
                            <!-- Notation mixte -->
                            <div v-else-if="line.notationType === 'mixed'">
                              <div class="mb-3">
                                <div class="text-caption mb-1">Score commun</div>
                                <v-radio-group
                                  v-model="currentEvaluation.scores[line._id].commonScore"
                                  inline
                                  hide-details
                                >
                                  <v-radio label="Non" :value="0" color="error" />
                                  <v-radio label="Oui" :value="1" color="success" />
                                </v-radio-group>
                              </div>
                              
                              <v-divider class="my-2" />
                              
                              <div>
                                <div class="text-caption mb-2">Scores individuels (optionnel)</div>
                                <div v-for="student in getTargetStudents()" :key="student?._id || `student-${student?.firstName}-${student?.lastName}`" class="mb-2">
                                  <div class="text-caption mb-1">{{ student?.firstName || 'Prénom' }} {{ student?.lastName || 'Nom' }}</div>
                                  <v-radio-group
                                    :model-value="getIndividualScore(line._id, student?._id)"
                                    @update:model-value="(value) => setIndividualScore(line._id, student?._id, value)"
                                    inline
                                    hide-details
                                  >
                                    <v-radio label="Non défini" :value="null" />
                                    <v-radio label="Non" :value="0" color="error" />
                                    <v-radio label="Oui" :value="1" color="success" />
                                  </v-radio-group>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <!-- Notation par échelle -->
                          <div v-else-if="line.type === 'scale'">
                            <!-- Notation commune -->
                            <div v-if="line.notationType === 'common'">
                              <v-slider
                                v-model="currentEvaluation.scores[line._id].commonScore"
                                :min="0"
                                :max="line.maxScore"
                                :step="1"
                                show-ticks="always"
                                tick-size="4"
                                thumb-label
                                color="primary"
                              >
                                <template v-slot:thumb-label="{ modelValue }">
                                  {{ modelValue }}/{{ line.maxScore }}
                                </template>
                              </v-slider>
                              <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                                <span>0 - Insuffisant</span>
                                <span>{{ Math.floor(line.maxScore / 2) }} - Satisfaisant</span>
                                <span>{{ line.maxScore }} - Excellent</span>
                              </div>
                            </div>
                            
                            <!-- Notation individuelle -->
                            <div v-else-if="line.notationType === 'individual'">
                              <div v-for="student in getTargetStudents()" :key="student?._id || `student-${student?.firstName}-${student?.lastName}`" class="mb-4">
                                <div class="text-caption mb-2">{{ student?.firstName || 'Prénom' }} {{ student?.lastName || 'Nom' }}</div>
                                <v-slider
                                  :model-value="getIndividualScore(line._id, student?._id)"
                                  @update:model-value="(value) => setIndividualScore(line._id, student?._id, value)"
                                  :min="0"
                                  :max="line.maxScore"
                                  :step="1"
                                  show-ticks="always"
                                  tick-size="4"
                                  thumb-label
                                  color="primary"
                                >
                                  <template v-slot:thumb-label="{ modelValue }">
                                    {{ modelValue }}/{{ line.maxScore }}
                                  </template>
                                </v-slider>
                              </div>
                            </div>
                            
                            <!-- Notation mixte -->
                            <div v-else-if="line.notationType === 'mixed'">
                              <div class="mb-4">
                                <div class="text-caption mb-2">Score commun</div>
                                <v-slider
                                  v-model="currentEvaluation.scores[line._id].commonScore"
                                  :min="0"
                                  :max="line.maxScore"
                                  :step="1"
                                  show-ticks="always"
                                  tick-size="4"
                                  thumb-label
                                  color="primary"
                                >
                                  <template v-slot:thumb-label="{ modelValue }">
                                    {{ modelValue }}/{{ line.maxScore }}
                                  </template>
                                </v-slider>
                              </div>
                              
                              <v-divider class="my-3" />
                              
                              <div>
                                <div class="text-caption mb-2">Scores individuels (optionnel)</div>
                                <div v-for="student in getTargetStudents()" :key="student?._id || `student-${student?.firstName}-${student?.lastName}`" class="mb-3">
                                  <div class="text-caption mb-1">{{ student?.firstName || 'Prénom' }} {{ student?.lastName || 'Nom' }}</div>
                                  <v-checkbox
                                    :model-value="hasIndividualScore(line._id, student?._id)"
                                    @update:model-value="(enabled) => toggleIndividualScore(line._id, student?._id, enabled)"
                                    label="Score individuel spécifique"
                                    density="compact"
                                    hide-details
                                    class="mb-2"
                                  />
                                  <v-slider
                                    v-if="hasIndividualScore(line._id, student?._id)"
                                    :model-value="getIndividualScore(line._id, student?._id)"
                                    @update:model-value="(value) => setIndividualScore(line._id, student?._id, value)"
                                    :min="0"
                                    :max="line.maxScore"
                                    :step="1"
                                    show-ticks="always"
                                    tick-size="4"
                                    thumb-label
                                    color="primary"
                                  >
                                    <template v-slot:thumb-label="{ modelValue }">
                                      {{ modelValue }}/{{ line.maxScore }}
                                    </template>
                                  </v-slider>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div class="mt-2 text-caption">
                            <v-chip size="x-small" :color="line.notationType === 'common' ? 'green' : line.notationType === 'individual' ? 'blue' : 'orange'" variant="flat">
                              {{ getNotationTypeLabel(line.notationType) }}
                            </v-chip>
                          </div>
                        </v-card>
                      </v-col>
                    </v-row>
                    <div v-else class="text-center pa-4 text-medium-emphasis">
                      Aucun critère défini pour cette section
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </div>

            <!-- Résumé de progression -->
            <div v-if="hasValidTarget && Object.keys(currentEvaluation.scores).length > 0" class="mt-6">
              <v-card variant="tonal" color="info">
                <v-card-text>
                  <div class="d-flex align-center mb-3">
                    <v-icon class="mr-2">mdi-chart-line</v-icon>
                    <span class="font-weight-medium">Progression de l'évaluation</span>
                  </div>
                  <v-progress-linear
                    :model-value="evaluationProgress"
                    :color="evaluationProgress === 100 ? 'success' : 'info'"
                    height="8"
                    rounded
                    class="mb-2"
                  />
                  <div class="text-body-2">
                    {{ Object.keys(currentEvaluation.scores).length }} critères sur {{ totalCriteria }} évalués ({{ evaluationProgress }}%)
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>
        
        <v-card-actions class="pa-6">
          <v-btn 
            color="grey-darken-1" 
            variant="text"
            @click="closeEvaluationDialog"
            prepend-icon="mdi-close"
          >
            Annuler
          </v-btn>
          <v-spacer />
          <v-btn
            color="primary"
            variant="elevated"
            @click="saveEvaluation"
            :loading="saving"
            :disabled="!canSaveEvaluation"
            prepend-icon="mdi-check"
          >
            {{ currentEvaluation._id ? 'Modifier' : 'Créer' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de confirmation de suppression -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">Confirmation de suppression</v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer cette évaluation ? Cette action est irréversible.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey-darken-1" variant="text" @click="deleteDialog = false">
            Annuler
          </v-btn>
          <v-btn color="error" @click="deleteEvaluation">
            Supprimer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar pour les notifications -->
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
const saving = ref(false);
const loadingForms = ref(false);
const evaluations = ref([]);
const filteredEvaluations = ref([]);
const validForms = ref([]);
const availableStudents = ref([]);
const availablePromotions = ref([]);
const availableGroups = ref([]);
const availableSubgroups = ref([]);

// Informations utilisateur connecté
const currentUser = ref(null);
const isAdmin = ref(false);

// Pagination
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  pages: 0,
  hasNextPage: false,
  hasPrevPage: false
});

// Filtres
const search = ref('');
const selectedForm = ref(null);
const selectedPromotion = ref(null);
const selectedGroup = ref(null);
const searchForms = ref('');

// Dialogs
const selectFormDialog = ref(false);
const evaluationDialog = ref(false);
const deleteDialog = ref(false);

// État de l'évaluation
const selectedFormData = ref(null);
const currentEvaluation = ref({
  _id: null,
  form: null,
  professor: null,
  student: null,
  group: null,
  subgroup: null,
  promotion: null,
  groupNumber: null,
  scores: {},
  evaluationType: null,
  targetStudents: []
});

const expandedSections = ref([]);
const evaluationFormRef = ref(null);
const evaluationFormValid = ref(false);
const evaluationToDelete = ref(null);

// Notifications
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
});

// En-têtes du tableau
const headers = ref([
  { title: 'Formulaire', align: 'start', key: 'form', sortable: false },
  { title: 'Cible', align: 'start', key: 'target', sortable: false },
  { title: 'Contexte', align: 'start', key: 'context', sortable: false },
  { title: 'Scores', align: 'start', key: 'scores', sortable: false },
  { title: 'Professeur', align: 'start', key: 'professor' },
  { title: 'Date', align: 'start', key: 'createdAt' },
  { title: 'Actions', align: 'end', key: 'actions', sortable: false }
]);

// Règles de validation
const rules = {
  required: v => !!v || 'Ce champ est requis',
  isNumber: v => !isNaN(parseFloat(v)) && isFinite(v) || 'Doit être un nombre'
};

// Options pour les filtres
const formOptions = computed(() => {
  const options = [{ title: 'Tous les formulaires', value: null }];
  validForms.value.forEach(form => {
    options.push({ title: form.title, value: form._id });
  });
  return options;
});

const promotionOptions = computed(() => {
  const options = [{ title: 'Toutes les promotions', value: null }];
  availablePromotions.value.forEach(promotion => {
    options.push({ 
      title: promotion.displayName || `${promotion.name} ${promotion.year}`, 
      value: promotion._id 
    });
  });
  return options;
});

const groupOptions = computed(() => {
  const options = [{ title: 'Tous les groupes', value: null }];
  availableGroups.value.forEach(group => {
    options.push({ title: group.name, value: group._id });
  });
  return options;
});

const filteredValidForms = computed(() => {
  if (!searchForms.value) return validForms.value;
  return validForms.value.filter(form =>
    form.title.toLowerCase().includes(searchForms.value.toLowerCase())
  );
});

// Computed property pour les étudiants disponibles selon le contexte
const studentsForEvaluation = computed(() => {
  if (!selectedFormData.value || selectedFormData.value.associationType !== 'student') return [];
  
  // Priorité aux étudiants assignés spécifiquement au formulaire
  if (selectedFormData.value.students && selectedFormData.value.students.length > 0) {
    console.log('Utilisation des étudiants assignés au formulaire:', selectedFormData.value.students.length);
    return selectedFormData.value.students.map(student => ({
      ...student,
      fullName: `${student.firstName} ${student.lastName}`
    }));
  }
  
  // Fallback vers tous les étudiants disponibles
  console.log('Formulaire individuel - utilisation de tous les étudiants disponibles:', availableStudents.value.length);
  return availableStudents.value;
});

// Computed property pour les groupes disponibles selon le contexte
const groupsForEvaluation = computed(() => {
  if (!selectedFormData.value || selectedFormData.value.associationType !== 'group') return [];
  
  // Priorité aux groupes assignés spécifiquement au formulaire
  if (selectedFormData.value.groups && selectedFormData.value.groups.length > 0) {
    console.log('Utilisation des groupes assignés au formulaire:', selectedFormData.value.groups.length);
    return selectedFormData.value.groups;
  }
  
  // Fallback vers tous les groupes disponibles
  console.log('Formulaire de groupe - utilisation de tous les groupes disponibles:', availableGroups.value.length);
  return availableGroups.value;
});

// Computed property pour les sous-groupes disponibles selon le contexte
const subgroupsForEvaluation = computed(() => {
  if (!selectedFormData.value || selectedFormData.value.associationType !== 'subgroup') return [];
  
  // Priorité aux sous-groupes assignés spécifiquement au formulaire
  if (selectedFormData.value.subgroups && selectedFormData.value.subgroups.length > 0) {
    console.log('Utilisation des sous-groupes assignés au formulaire:', selectedFormData.value.subgroups.length);
    return selectedFormData.value.subgroups;
  }
  
  // Fallback vers tous les sous-groupes disponibles
  console.log('Formulaire de sous-groupe - utilisation de tous les sous-groupes disponibles:', availableSubgroups.value.length);
  return availableSubgroups.value;
});

// Computed property pour la promotion disponible selon le contexte
const promotionForEvaluation = computed(() => {
  if (!selectedFormData.value || selectedFormData.value.associationType !== 'promotion') return null;
  
  // Retourner la promotion assignée spécifiquement au formulaire
  if (selectedFormData.value.promotion) {
    console.log('Utilisation de la promotion assignée au formulaire:', selectedFormData.value.promotion.name);
    return selectedFormData.value.promotion;
  }
  
  return null;
});

const hasValidTarget = computed(() => {
  if (!selectedFormData.value) return false;
  
  switch (selectedFormData.value.associationType) {
    case 'student':
      return !!currentEvaluation.value.student;
    case 'group':
      return !!currentEvaluation.value.group;
    case 'subgroup':
      return !!currentEvaluation.value.subgroup;
    case 'promotion':
      return !!selectedFormData.value.promotion; // Pour les promotions, la cible est déjà définie dans le formulaire
    default:
      return false;
  }
});

const totalCriteria = computed(() => {
  if (!selectedFormData.value) return 0;
  return selectedFormData.value.sections?.reduce((total, section) => {
    return total + (section.lines?.length || 0);
  }, 0) || 0;
});

const evaluationProgress = computed(() => {
  const totalScores = Object.keys(currentEvaluation.value.scores).length;
  const completedScores = Object.values(currentEvaluation.value.scores).filter(scoreData => {
    // Un score est considéré comme complété si :
    // - Pour 'common' : commonScore est défini
    // - Pour 'individual' : au moins un individualScore existe
    // - Pour 'mixed' : commonScore est défini OU au moins un individualScore existe
    
    if (scoreData.notationType === 'common') {
      return scoreData.commonScore !== undefined && scoreData.commonScore !== null;
    } else if (scoreData.notationType === 'individual') {
      return scoreData.individualScores && scoreData.individualScores.length > 0;
    } else if (scoreData.notationType === 'mixed') {
      const hasCommon = scoreData.commonScore !== undefined && scoreData.commonScore !== null;
      const hasIndividual = scoreData.individualScores && scoreData.individualScores.length > 0;
      return hasCommon || hasIndividual;
    }
    
    return false;
  }).length;
  
  const total = totalCriteria.value;
  return total > 0 ? Math.round((completedScores / total) * 100) : 0;
});

const canSaveEvaluation = computed(() => {
  const targetIsValid = hasValidTarget.value;
  const hasScores = Object.keys(currentEvaluation.value.scores).length > 0;
  const hasCompletedScores = Object.values(currentEvaluation.value.scores).some(scoreData => {
    // Vérifier qu'il y a au moins un score valide selon le type de notation
    if (scoreData.notationType === 'common') {
      return scoreData.commonScore !== undefined && scoreData.commonScore !== null;
    } else if (scoreData.notationType === 'individual') {
      return scoreData.individualScores && scoreData.individualScores.length > 0 &&
             scoreData.individualScores.some(is => is.score !== undefined && is.score !== null);
    } else if (scoreData.notationType === 'mixed') {
      const hasCommon = scoreData.commonScore !== undefined && scoreData.commonScore !== null;
      const hasIndividual = scoreData.individualScores && scoreData.individualScores.length > 0 &&
                           scoreData.individualScores.some(is => is.score !== undefined && is.score !== null);
      return hasCommon || hasIndividual;
    }
    return false;
  });
  
  return evaluationFormValid.value && targetIsValid && hasScores && hasCompletedScores;
});

// Chargement des données
onMounted(async () => {
  await loadCurrentUser();
  // Charger les étudiants en priorité pour les formulaires individuels
  await loadStudents();
  await Promise.all([
    loadEvaluations(),
    loadValidForms(),
    loadPromotions(),
    loadGroups(),
    loadSubgroups()
  ]);
  console.log('Toutes les données chargées. Étudiants disponibles:', availableStudents.value.length);
});

// Méthodes utilitaires
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getFormStatus = (form) => {
  const now = new Date();
  const validFrom = new Date(form.validFrom);
  const validTo = new Date(form.validTo);
  
  if (now < validFrom) return 'À venir';
  if (now > validTo) return 'Expiré';
  return 'Actif';
};

const getScorePercentage = (evaluation) => {
  const scoreCount = evaluation.scores?.length || 0;
  const totalCriteria = evaluation.form?.sections?.reduce((total, section) => {
    return total + (section.lines?.length || 0);
  }, 0) || 1;
  return Math.round((scoreCount / totalCriteria) * 100);
};

const getScoreColor = (evaluation) => {
  const percentage = getScorePercentage(evaluation);
  if (percentage === 100) return 'success';
  if (percentage > 50) return 'warning';
  return 'error';
};

const getSectionCompletionColor = (sectionIndex) => {
  const completed = getCompletedCriteria(sectionIndex);
  const total = selectedFormData.value.sections[sectionIndex].lines.length;
  const percentage = (completed / total) * 100;
  
  if (percentage === 100) return 'success';
  if (percentage > 50) return 'warning';
  return 'error';
};

const getCompletedCriteria = (sectionIndex) => {
  if (!selectedFormData.value) return 0;
  const section = selectedFormData.value.sections[sectionIndex];
  if (!section) return 0;
  
  return section.lines.filter(line => {
    const scoreData = currentEvaluation.value.scores[line._id];
    if (!scoreData) return false;
    
    // Vérifier selon le type de notation
    if (scoreData.notationType === 'common') {
      return scoreData.commonScore !== undefined && scoreData.commonScore !== null;
    } else if (scoreData.notationType === 'individual') {
      return scoreData.individualScores && scoreData.individualScores.length > 0;
    } else if (scoreData.notationType === 'mixed') {
      const hasCommon = scoreData.commonScore !== undefined && scoreData.commonScore !== null;
      const hasIndividual = scoreData.individualScores && scoreData.individualScores.length > 0;
      return hasCommon || hasIndividual;
    }
    
    return false;
  }).length;
};

const getNotationTypeLabel = (type) => {
  const labels = {
    'common': 'Commune',
    'individual': 'Individuelle',
    'mixed': 'Mixte'
  };
  return labels[type] || type;
};

// Fonction pour générer le message d'aide du select d'étudiant
const getStudentSelectHint = () => {
  if (!selectedFormData.value) return '';
  
  if (studentsForEvaluation.value.length === 0) {
    return 'Aucun étudiant disponible pour ce formulaire';
  }
  
  // Vérifier d'où viennent les étudiants
  if (selectedFormData.value.students && selectedFormData.value.students.length > 0) {
    return `${studentsForEvaluation.value.length} étudiant(s) assigné(s) spécifiquement à ce formulaire`;
  } else if (currentEvaluation.value.targetStudents && currentEvaluation.value.targetStudents.length > 0) {
    return `${studentsForEvaluation.value.length} étudiant(s) cible(s) chargé(s) pour ce formulaire`;
  } else {
    return `${studentsForEvaluation.value.length} étudiant(s) disponible(s) (tous les étudiants)`;
  }
};

// Méthodes de chargement des données
const loadCurrentUser = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Utilisateur connecté:', data);
      currentUser.value = data;
      isAdmin.value = data.role === 'admin';
    } else {
      console.error('Erreur lors du chargement du profil - Status:', response.status);
    }
  } catch (error) {
    console.error('Erreur lors du chargement du profil utilisateur:', error);
  }
};

const loadTargetStudentsForForm = async (formId) => {
  try {
    const response = await fetch(`http://localhost:5000/api/forms/${formId}/target-students`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      currentEvaluation.value.targetStudents = data.targetStudents || [];
      console.log('Étudiants cibles chargés:', currentEvaluation.value.targetStudents);
    } else {
      console.log('Pas d\'étudiants cibles spécifiques, utilisation de tous les étudiants disponibles');
      // Si l'API ne retourne pas d'étudiants cibles spécifiques, 
      // on utilise tous les étudiants disponibles pour les formulaires individuels
      if (selectedFormData.value?.associationType === 'student') {
        currentEvaluation.value.targetStudents = availableStudents.value;
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des étudiants cibles:', error);
    // En cas d'erreur, utiliser tous les étudiants pour les formulaires individuels
    if (selectedFormData.value?.associationType === 'student') {
      currentEvaluation.value.targetStudents = availableStudents.value;
      console.log('Utilisation de tous les étudiants disponibles après erreur:', availableStudents.value.length);
    }
  }
};

const loadEvaluations = async () => {
  loading.value = true;
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('page', pagination.value.page);
    queryParams.append('limit', pagination.value.limit);
    
    if (selectedForm.value) queryParams.append('form', selectedForm.value);
    if (selectedPromotion.value) queryParams.append('promotion', selectedPromotion.value);
    if (selectedGroup.value) queryParams.append('group', selectedGroup.value);

    const response = await fetch(`http://localhost:5000/api/evaluations?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des évaluations');
    }

    const data = await response.json();
    evaluations.value = data.evaluations || data || [];
    filteredEvaluations.value = evaluations.value;
    
    if (data.pagination) {
      pagination.value = data.pagination;
    }
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors du chargement des évaluations',
      color: 'error'
    };
  } finally {
    loading.value = false;
  }
};

const loadValidForms = async () => {
  loadingForms.value = true;
  try {
    const response = await fetch('http://localhost:5000/api/forms', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      validForms.value = data.forms || data || [];
    }
  } catch (error) {
    console.error('Erreur lors du chargement des formulaires:', error);
  } finally {
    loadingForms.value = false;
  }
};

const loadStudents = async () => {
  try {
    console.log('Chargement des étudiants...');
    const response = await fetch('http://localhost:5000/api/students', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const students = (data.students || data || []).map(student => ({
        ...student,
        fullName: `${student.firstName} ${student.lastName}`
      }));
      availableStudents.value = students;
      console.log('Étudiants chargés avec succès:', students.length);
    } else {
      console.error('Erreur lors du chargement des étudiants - Status:', response.status);
      const errorData = await response.json();
      console.error('Détails de l\'erreur:', errorData);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des étudiants:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors du chargement des étudiants',
      color: 'error'
    };
  }
};

const loadPromotions = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/promotions', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      availablePromotions.value = (data.promotions || data || []).map(promotion => ({
        ...promotion,
        displayName: `${promotion.name} ${promotion.year}`
      }));
    }
  } catch (error) {
    console.error('Erreur lors du chargement des promotions:', error);
  }
};

const loadGroups = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/groups', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      availableGroups.value = data.groups || data || [];
    }
  } catch (error) {
    console.error('Erreur lors du chargement des groupes:', error);
  }
};

const loadSubgroups = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/subgroups', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      availableSubgroups.value = data.subgroups || data || [];
    }
  } catch (error) {
    console.error('Erreur lors du chargement des sous-groupes:', error);
  }
};

const handleTableOptions = (options) => {
  pagination.value.page = options.page;
  pagination.value.limit = options.itemsPerPage;
  loadEvaluations();
};

const filterEvaluations = () => {
  loadEvaluations();
};

// Méthodes des dialogs
const openNewEvaluationDialog = () => {
  selectFormDialog.value = true;
};

const selectForm = async (form) => {
  if (!form || !form._id) {
    console.error('Formulaire invalide:', form);
    return;
  }
  
  console.log('Sélection du formulaire:', form.title, 'Type:', form.associationType);
  console.log('Étudiants assignés au formulaire:', form.students?.length || 0);
  console.log('Groupes assignés au formulaire:', form.groups?.length || 0);
  console.log('Sous-groupes assignés au formulaire:', form.subgroups?.length || 0);
  
  selectedFormData.value = form;
  resetCurrentEvaluation();
  currentEvaluation.value.form = form._id;
  currentEvaluation.value.professor = currentUser.value?._id;
  currentEvaluation.value.evaluationType = form.associationType;
  
  // Charger les étudiants cibles pour ce formulaire (backup)
  await loadTargetStudentsForForm(form._id);
  
  // Pour les formulaires individuels, s'assurer qu'on a des étudiants disponibles
  if (form.associationType === 'student') {
    // Si le formulaire n'a pas d'étudiants assignés ET qu'on n'a pas d'étudiants disponibles
    if ((!form.students || form.students.length === 0) && availableStudents.value.length === 0) {
      console.log('Rechargement des étudiants car aucun étudiant assigné et liste générale vide');
      await loadStudents();
    }
    
    // Pré-sélectionner le premier étudiant assigné si il n'y en a qu'un
    if (form.students && form.students.length === 1) {
      currentEvaluation.value.student = form.students[0]._id;
      console.log('Pré-sélection de l\'étudiant unique:', form.students[0].firstName, form.students[0].lastName);
    }
  }
  
  // Initialiser la structure des scores selon le formulaire
  if (form.sections && Array.isArray(form.sections)) {
    form.sections.forEach(section => {
      if (section && section.lines && Array.isArray(section.lines)) {
        section.lines.forEach(line => {
          if (line && line._id && line.notationType) {
            initializeScoreStructure(line._id, line.notationType);
          }
        });
      }
    });
  }
  
  console.log('Configuration terminée:');
  console.log('- Étudiants du formulaire:', form.students?.length || 0);
  console.log('- Étudiants disponibles généraux:', availableStudents.value.length);
  console.log('- Étudiants cibles chargés:', currentEvaluation.value.targetStudents.length);
  console.log('- Étudiant pré-sélectionné:', currentEvaluation.value.student || 'aucun');
  
  selectFormDialog.value = false;
  evaluationDialog.value = true;
  expandedSections.value = form.sections?.map((_, index) => index) || [];
};

const resetCurrentEvaluation = () => {
  currentEvaluation.value = {
    _id: null,
    form: null,
    professor: null,
    student: null,
    groupNumber: null,
    scores: {},
    promotion: null,
    group: null,
    subgroup: null,
    evaluationType: null,
    targetStudents: []
  };
};

// Méthodes pour gérer les scores selon la structure backend
const initializeScoreStructure = (lineId, notationType) => {
  if (!lineId || !notationType) return;
  
  if (!currentEvaluation.value.scores[lineId]) {
    currentEvaluation.value.scores[lineId] = {
      lineId,
      notationType,
      commonScore: notationType === 'individual' ? undefined : 0,
      individualScores: notationType === 'common' ? [] : []
    };
  }
};

const getTargetStudents = () => {
  // 1. Priorité aux étudiants assignés spécifiquement au formulaire
  if (selectedFormData.value?.students && selectedFormData.value.students.length > 0) {
    console.log('Utilisation des étudiants assignés au formulaire pour la notation:', selectedFormData.value.students.length);
    return selectedFormData.value.students.filter(student => 
      student && student._id && student.firstName && student.lastName
    );
  }
  
  // 2. Utiliser les targetStudents si disponibles (chargés via API)
  if (currentEvaluation.value.targetStudents && currentEvaluation.value.targetStudents.length > 0) {
    console.log('Utilisation des étudiants cibles pour la notation:', currentEvaluation.value.targetStudents.length);
    return currentEvaluation.value.targetStudents.filter(student => 
      student && student._id && student.firstName && student.lastName
    );
  }
  
  if (!selectedFormData.value) return [];
  
  const associationType = selectedFormData.value.associationType;
  
  if (associationType === 'student' && currentEvaluation.value.student) {
    // Pour l'évaluation d'un étudiant individuel sélectionné
    const student = availableStudents.value.find(s => s && s._id === currentEvaluation.value.student);
    if (student && student._id && student.firstName && student.lastName) {
      console.log('Utilisation de l\'étudiant sélectionné pour la notation:', student.fullName);
      return [student];
    }
  } else if (associationType === 'promotion' && currentEvaluation.value.promotion) {
    // Pour l'évaluation d'une promotion, récupérer les étudiants de la promotion
    const promotionStudents = availableStudents.value.filter(s => 
      s && s._id && s.firstName && s.lastName &&
      s.promotions && s.promotions.some(p => p && p._id === currentEvaluation.value.promotion)
    );
    console.log('Utilisation des étudiants de la promotion pour la notation:', promotionStudents.length);
    return promotionStudents;
  }
  
  // Pour les groupes et sous-groupes, retourner un tableau vide par défaut
  console.log('Aucun étudiant cible défini');
  return [];
};

const getIndividualScore = (lineId, studentId) => {
  if (!lineId || !studentId) return 0;
  
  const scoreData = currentEvaluation.value.scores[lineId];
  if (!scoreData || !scoreData.individualScores) return 0;
  
  const individualScore = scoreData.individualScores.find(is => is && is.studentId === studentId);
  return individualScore ? individualScore.score : 0;
};

const setIndividualScore = (lineId, studentId, score) => {
  if (!lineId || !studentId) return;
  
  const scoreData = currentEvaluation.value.scores[lineId];
  if (!scoreData) return;
  
  if (!scoreData.individualScores) {
    scoreData.individualScores = [];
  }
  
  const existingIndex = scoreData.individualScores.findIndex(is => is && is.studentId === studentId);
  if (existingIndex >= 0) {
    scoreData.individualScores[existingIndex].score = score;
  } else {
    scoreData.individualScores.push({ studentId, score });
  }
};

const hasIndividualScore = (lineId, studentId) => {
  if (!lineId || !studentId) return false;
  
  const scoreData = currentEvaluation.value.scores[lineId];
  if (!scoreData || !scoreData.individualScores) return false;
  
  return scoreData.individualScores.some(is => is && is.studentId === studentId);
};

const toggleIndividualScore = (lineId, studentId, enabled) => {
  if (!lineId || !studentId) return;
  
  const scoreData = currentEvaluation.value.scores[lineId];
  if (!scoreData) return;
  
  if (!scoreData.individualScores) {
    scoreData.individualScores = [];
  }
  
  if (enabled) {
    const exists = scoreData.individualScores.some(is => is && is.studentId === studentId);
    if (!exists) {
      scoreData.individualScores.push({ studentId, score: 0 });
    }
  } else {
    const index = scoreData.individualScores.findIndex(is => is && is.studentId === studentId);
    if (index >= 0) {
      scoreData.individualScores.splice(index, 1);
    }
  }
};

const closeEvaluationDialog = () => {
  evaluationDialog.value = false;
  selectedFormData.value = null;
  resetCurrentEvaluation();
};

// Méthodes CRUD
const saveEvaluation = async () => {
  if (!evaluationFormRef.value) return;
  
  const { valid } = await evaluationFormRef.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    // Debug - afficher les scores bruts avant transformation
    console.log('Scores bruts:', JSON.stringify(currentEvaluation.value.scores, null, 2));

    // Transformer les scores selon la structure exacte du modèle backend
    const scores = [];
    
    Object.entries(currentEvaluation.value.scores).forEach(([lineId, scoreData]) => {
      const scoreEntry = {
        lineId,
        notationType: scoreData.notationType
      };
      
      // Pour la notation commune ou mixte avec score commun
      if ((scoreData.notationType === 'common' || scoreData.notationType === 'mixed') && 
          scoreData.commonScore !== undefined && scoreData.commonScore !== null) {
        scoreEntry.commonScore = Number(scoreData.commonScore);
      }
      
      // Pour la notation individuelle ou mixte avec scores individuels
      if ((scoreData.notationType === 'individual' || scoreData.notationType === 'mixed') && 
          scoreData.individualScores && scoreData.individualScores.length > 0) {
        scoreEntry.individualScores = scoreData.individualScores
          .filter(indScore => indScore.score !== undefined && indScore.score !== null)
          .map(indScore => ({
            studentId: indScore.studentId,
            score: Number(indScore.score)
          }));
      }
      
      // Ajouter le score seulement s'il a du contenu
      if (scoreEntry.commonScore !== undefined || 
          (scoreEntry.individualScores && scoreEntry.individualScores.length > 0)) {
        scores.push(scoreEntry);
      }
    });

    // Debug - afficher les scores transformés avant envoi
    console.log('Scores transformés:', JSON.stringify(scores, null, 2));

    // Validation avant envoi : s'assurer qu'on a au moins un score valide
    if (scores.length === 0) {
      throw new Error('Aucun score valide à enregistrer. Veuillez saisir au moins un score.');
    }
    
    // Vérifier que tous les scores ont des valeurs valides
    for (const score of scores) {
      if (score.commonScore !== undefined && (isNaN(score.commonScore) || score.commonScore < 0)) {
        throw new Error(`Score commun invalide pour le critère ${score.lineId}`);
      }
      if (score.individualScores) {
        for (const indScore of score.individualScores) {
          if (isNaN(indScore.score) || indScore.score < 0) {
            throw new Error(`Score individuel invalide pour l'étudiant ${indScore.studentId}`);
          }
        }
      }
    }

    // Construire le payload selon le modèle backend Evaluation
    const evaluationData = {
      formId: currentEvaluation.value.form,
      professorId: currentEvaluation.value.professor,
      scores,
      evaluationType: currentEvaluation.value.evaluationType // Requis par le modèle
    };

    // Ajouter les champs selon le type d'évaluation
    if (currentEvaluation.value.evaluationType === 'student') {
      evaluationData.studentId = currentEvaluation.value.student;
    } else if (currentEvaluation.value.evaluationType === 'group') {
      // Pour les groupes, on peut envoyer soit groupNumber soit group, le backend se débrouillera
      if (currentEvaluation.value.group) {
        evaluationData.group = currentEvaluation.value.group;
        evaluationData.groupNumber = 1; // Valeur par défaut
      }
    } else if (currentEvaluation.value.evaluationType === 'subgroup') {
      evaluationData.subgroup = currentEvaluation.value.subgroup;
    } else if (currentEvaluation.value.evaluationType === 'promotion') {
      // Pour les promotions, l'information est dans le formulaire, mais on peut l'ajouter pour clarté
      evaluationData.promotion = selectedFormData.value.promotion?._id || currentEvaluation.value.promotion;
    }

    const url = currentEvaluation.value._id
      ? `http://localhost:5000/api/evaluations/update/${currentEvaluation.value._id}`
      : 'http://localhost:5000/api/evaluations/add';

    const method = currentEvaluation.value._id ? 'PUT' : 'POST';

    // Debug - afficher le payload envoyé
    console.log('Payload envoyé au backend:', JSON.stringify(evaluationData, null, 2));

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(evaluationData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erreur lors de l'${currentEvaluation.value._id ? 'édition' : 'ajout'} de l'évaluation`);
    }

    const result = await response.json();

    snackbar.value = {
      show: true,
      text: result.message || `Évaluation ${currentEvaluation.value._id ? 'modifiée' : 'créée'} avec succès`,
      color: 'success'
    };

    closeEvaluationDialog();
    await loadEvaluations();
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: error.message || `Erreur lors de l'${currentEvaluation.value._id ? 'édition' : 'ajout'} de l'évaluation`,
      color: 'error'
    };
  } finally {
    saving.value = false;
  }
};

const viewEvaluation = async (item) => {
  try {
    const response = await fetch(`http://localhost:5000/api/evaluations/${item._id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const evaluation = await response.json();
      selectedFormData.value = evaluation.form;
      
      // Convertir les scores en format pour l'édition selon la nouvelle structure
      const scores = {};
      (evaluation.scores || []).forEach(score => {
        scores[score.lineId] = {
          lineId: score.lineId,
          notationType: score.notationType,
          commonScore: score.commonScore,
          individualScores: score.individualScores || []
        };
      });
      
      currentEvaluation.value = {
        _id: evaluation._id,
        form: evaluation.form._id,
        professor: evaluation.professor?._id || currentUser.value?._id,
        student: evaluation.student?._id || null,
        groupNumber: evaluation.groupNumber || null,
        scores,
        promotion: evaluation.promotion?._id || null,
        group: evaluation.group?._id || null,
        subgroup: evaluation.subgroup?._id || null,
        evaluationType: evaluation.evaluationType || evaluation.form.associationType,
        targetStudents: evaluation.targetStudents || []
      };
      
      evaluationDialog.value = true;
      expandedSections.value = evaluation.form.sections?.map((_, index) => index) || [];
    }
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors du chargement de l\'évaluation',
      color: 'error'
    };
  }
};

const editEvaluation = (item) => {
  viewEvaluation(item);
};

const exportEvaluation = async (item) => {
  try {
    const response = await fetch(`http://localhost:5000/api/evaluations/export/${item.form._id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.form.title}-evaluations.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      snackbar.value = {
        show: true,
        text: 'Export CSV réalisé avec succès',
        color: 'success'
      };
    }
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    snackbar.value = {
      show: true,
      text: 'Erreur lors de l\'export',
      color: 'error'
    };
  }
};

const exportAllEvaluations = async () => {
  snackbar.value = {
    show: true,
    text: 'Fonction d\'export global en cours de développement',
    color: 'info'
  };
};

const confirmDeleteEvaluation = (item) => {
  evaluationToDelete.value = item;
  deleteDialog.value = true;
};

const deleteEvaluation = async () => {
  if (!evaluationToDelete.value) return;

  try {
    const response = await fetch(`http://localhost:5000/api/evaluations/delete/${evaluationToDelete.value._id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la suppression de l\'évaluation');
    }

    const result = await response.json();

    snackbar.value = {
      show: true,
      text: result.message || 'Évaluation supprimée avec succès',
      color: 'success'
    };

    deleteDialog.value = false;
    evaluationToDelete.value = null;
    await loadEvaluations();
  } catch (error) {
    console.error('Erreur:', error);
    snackbar.value = {
      show: true,
      text: error.message || 'Erreur lors de la suppression de l\'évaluation',
      color: 'error'
    };
  }
};


</script>

<style scoped>
.v-card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.v-data-table {
  border-radius: 12px;
}

.v-chip {
  font-weight: 500;
}

.v-dialog {
  transition: all 0.3s ease;
}

.v-expansion-panels {
  border-radius: 8px;
  overflow: hidden;
}

.v-expansion-panel {
  border: 1px solid #e0e0e0;
  margin-bottom: 8px;
  border-radius: 8px !important;
}

.v-expansion-panel-title {
  background-color: #f8f9fa;
}

.v-expansion-panel-text {
  background-color: #ffffff;
}

.v-btn {
  text-transform: none;
  font-weight: 500;
}

.v-list-item {
  border-radius: 8px;
  margin-bottom: 8px;
  transition: background-color 0.2s;
}

.v-list-item:hover {
  background-color: #f5f5f5;
}

.v-slider {
  margin: 16px 0;
}

.v-radio-group {
  margin: 8px 0;
}

.v-progress-linear {
  border-radius: 4px;
}

/* Styles pour les critères d'évaluation */
.evaluation-criteria .v-card {
  transition: all 0.2s;
  border: 2px solid transparent;
}

.evaluation-criteria .v-card:hover {
  border-color: #1976d2;
  transform: translateY(-1px);
}

/* Animation pour les progress bars */
.v-progress-linear .v-progress-linear__background {
  transition: all 0.3s ease;
}

/* Responsive design */
@media (max-width: 768px) {
  .v-dialog {
    margin: 16px;
  }
  
  .v-card-text {
    padding: 16px !important;
  }
  
  .v-expansion-panel-text .v-card-text {
    padding: 8px !important;
  }
}

/* Style pour les alertes et notifications */
.v-alert {
  border-radius: 8px;
}

.v-snackbar {
  border-radius: 8px;
}

/* Style pour les boutons d'action */
.v-btn--icon {
  transition: all 0.2s;
}

.v-btn--icon:hover {
  transform: scale(1.1);
}

/* Style pour les champs de formulaire */
.v-text-field, .v-select {
  margin-bottom: 8px;
}

/* Style pour les sections vides */
.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #666;
}

.empty-state .v-icon {
  opacity: 0.5;
}

/* Animation pour le chargement */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

/* Style pour les tooltips */
.v-tooltip .v-overlay__content {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}
</style>
