<template>
  <div :class="styles.authCard" dir="ltr">
    <!-- Main Card Content -->
    <div :class="styles.cardContent">
      <!-- Left Column - Form -->
      <div :class="styles.formColumn">
        <!-- Enhanced Avatar Section -->
        <div :class="styles.avatarSection">
          <div :class="[styles.avatar, isLogin ? styles.avatarLogin : styles.avatarRegister]">
            <div :class="styles.avatarRing"></div>
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              :class="styles.avatarIcon"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" 
                fill="currentColor"
              />
              <path 
                d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" 
                fill="currentColor"
              />
            </svg>
          </div>
          <div :class="styles.avatarLabel">
            {{ isLogin ? 'Welcome to the beta version' : 'Create Account' }}
          </div>
        </div>

        <form :class="styles.authForm" @submit.prevent="handleSubmit">
          <!-- Company Information (Registration Only) -->
          <div v-if="!isLogin" style="margin: 24px 0 16px 0;">
            <h3 style="color: #E8EDF2; font-size: 16px; font-weight: 700; margin: 0; padding-bottom: 8px; border-bottom: 1px solid rgba(31, 38, 43, 0.5);">Company Information</h3>
          </div>

          <div v-if="!isLogin" :class="styles.inputGroup">
            <label for="companyName" :class="styles.label">
              <span :class="styles.labelIcon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 21H21V7L12 2L3 7V21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M9 21V12H15V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              Company Name *
            </label>
            <div :class="styles.inputWrapper">
              <input
                id="companyName"
                v-model="formData.companyName"
                type="text"
                :class="[styles.input, formErrors.companyName ? styles.inputError : '']"
                autocomplete="organization"
                placeholder="Enter company name"
                @blur="validateField('companyName')"
                required
              />
              <div :class="styles.inputFocus"></div>
            </div>
            <div v-if="formErrors.companyName" :class="styles.errorMessage">
              {{ formErrors.companyName }}
            </div>
          </div>

          <div v-if="!isLogin" :class="styles.inputGroup">
            <label for="companyArabicName" :class="styles.label">
              <span :class="styles.labelIcon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 21H21V7L12 2L3 7V21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M9 21V12H15V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              Arabic Company Name
            </label>
            <div :class="styles.inputWrapper">
              <input
                id="companyArabicName"
                v-model="formData.companyArabicName"
                type="text"
                :class="[styles.input, formErrors.companyArabicName ? styles.inputError : '']"
                placeholder="Enter Arabic company name (optional)"
                @blur="validateField('companyArabicName')"
              />
              <div :class="styles.inputFocus"></div>
            </div>
            <div v-if="formErrors.companyArabicName" :class="styles.errorMessage">
              {{ formErrors.companyArabicName }}
            </div>
          </div>

          <div v-if="!isLogin" :class="styles.inputGroup">
            <label for="crNumber" :class="styles.label">
              <span :class="styles.labelIcon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              CR Number
            </label>
            <div :class="styles.inputWrapper">
              <input
                id="crNumber"
                v-model="formData.crNumber"
                type="text"
                :class="[styles.input, formErrors.crNumber ? styles.inputError : '']"
                placeholder="Commercial Registration Number (optional)"
                @blur="validateField('crNumber')"
              />
              <div :class="styles.inputFocus"></div>
            </div>
            <div v-if="formErrors.crNumber" :class="styles.errorMessage">
              {{ formErrors.crNumber }}
            </div>
          </div>

          <div v-if="!isLogin" :class="styles.inputGroup">
            <label for="moiNumber" :class="styles.label">
              <span :class="styles.labelIcon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              MOI Number
            </label>
            <div :class="styles.inputWrapper">
              <input
                id="moiNumber"
                v-model="formData.moiNumber"
                type="text"
                :class="[styles.input, formErrors.moiNumber ? styles.inputError : '']"
                placeholder="Ministry of Investment Number (optional)"
                @blur="validateField('moiNumber')"
              />
              <div :class="styles.inputFocus"></div>
            </div>
            <div v-if="formErrors.moiNumber" :class="styles.errorMessage">
              {{ formErrors.moiNumber }}
            </div>
          </div>

          <div v-if="!isLogin" :class="styles.inputGroup">
            <label for="countryOfIncorporation" :class="styles.label">
              <span :class="styles.labelIcon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 12H22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              Country of Incorporation
            </label>
            <div :class="styles.inputWrapper">
              <input
                id="countryOfIncorporation"
                v-model="formData.countryOfIncorporation"
                type="text"
                :class="[styles.input, formErrors.countryOfIncorporation ? styles.inputError : '']"
                placeholder="Country of incorporation (optional)"
                @blur="validateField('countryOfIncorporation')"
              />
              <div :class="styles.inputFocus"></div>
            </div>
            <div v-if="formErrors.countryOfIncorporation" :class="styles.errorMessage">
              {{ formErrors.countryOfIncorporation }}
            </div>
          </div>

          <!-- User Information -->
          <div v-if="!isLogin" style="margin: 24px 0 16px 0;">
            <h3 style="color: #E8EDF2; font-size: 16px; font-weight: 700; margin: 0; padding-bottom: 8px; border-bottom: 1px solid rgba(31, 38, 43, 0.5);">Administrator Account</h3>
          </div>

          <!-- Enhanced Input Groups -->
          <div v-if="!isLogin" :class="styles.inputGroup">
            <label :for="usernameId" :class="styles.label">
              <span :class="styles.labelIcon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              Username
            </label>
            <div :class="styles.inputWrapper">
              <input
                :id="usernameId"
                v-model="formData.username"
                type="text"
                :class="[styles.input, formErrors.username ? styles.inputError : '']"
                autocomplete="username"
                placeholder="Enter your username"
                @blur="validateField('username')"
                required
              />
              <div :class="styles.inputFocus"></div>
            </div>
            <div v-if="formErrors.username" :class="styles.errorMessage">
              {{ formErrors.username }}
            </div>
          </div>

          <div :class="styles.inputGroup">
            <label :for="emailId" :class="styles.label">
              <span :class="styles.labelIcon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <polyline points="22,6 12,13 2,6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              {{ isLogin ? 'Username or Email' : 'Email Address' }}
            </label>
            <div :class="styles.inputWrapper">
              <input
                :id="emailId"
                v-model="formData.email"
                :type="isLogin ? 'text' : 'email'"
                :class="[styles.input, styles.fixedDimensionInput, formErrors.email ? styles.inputError : '']"
                :autocomplete="isLogin ? 'off' : 'email'"
                :placeholder="isLogin ? 'Enter username or email' : 'Enter your email address'"
                @blur="validateField('email')"
                readonly
                onfocus="this.removeAttribute('readonly')"
                required
              />
              <div :class="styles.inputFocus"></div>
            </div>
            <div v-if="formErrors.email" :class="styles.errorMessage">
              {{ formErrors.email }}
            </div>
          </div>

          <div v-if="!isLogin" :class="styles.inputGroup">
            <label :for="firstNameId" :class="styles.label">
              <span :class="styles.labelIcon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              First Name
            </label>
            <div :class="styles.inputWrapper">
              <input
                :id="firstNameId"
                v-model="formData.firstName"
                type="text"
                :class="[styles.input, formErrors.firstName ? styles.inputError : '']"
                autocomplete="given-name"
                placeholder="Enter your first name"
                @blur="validateField('firstName')"
                required
              />
              <div :class="styles.inputFocus"></div>
            </div>
            <div v-if="formErrors.firstName" :class="styles.errorMessage">
              {{ formErrors.firstName }}
            </div>
          </div>

          <div v-if="!isLogin" :class="styles.inputGroup">
            <label :for="lastNameId" :class="styles.label">
              <span :class="styles.labelIcon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              Last Name
            </label>
            <div :class="styles.inputWrapper">
              <input
                :id="lastNameId"
                v-model="formData.lastName"
                type="text"
                :class="[styles.input, formErrors.lastName ? styles.inputError : '']"
                autocomplete="family-name"
                placeholder="Enter your last name"
                @blur="validateField('lastName')"
                required
              />
              <div :class="styles.inputFocus"></div>
            </div>
            <div v-if="formErrors.lastName" :class="styles.errorMessage">
              {{ formErrors.lastName }}
            </div>
          </div>

          <div :class="styles.inputGroup">
            <label :for="passwordId" :class="styles.label">
              <span :class="styles.labelIcon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              Password
            </label>
            <div :class="styles.inputWrapper">
              <input
                :id="passwordId"
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                :class="[styles.input, styles.passwordInput, styles.fixedDimensionInput, formErrors.password ? styles.inputError : '']"
                :autocomplete="isLogin ? 'off' : 'new-password'"
                :placeholder="'Enter your password'"
                @blur="validateField('password')"
                readonly
                onfocus="this.removeAttribute('readonly')"
                required
              />
              <button 
                type="button" 
                :class="styles.passwordToggle"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
              >
                <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M1 1l22 22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div :class="styles.inputFocus"></div>
            </div>
            <div v-if="formErrors.password" :class="styles.errorMessage">
              {{ formErrors.password }}
            </div>
          </div>

          <div v-if="!isLogin" :class="styles.inputGroup">
            <label :for="confirmPasswordId" :class="styles.label">
              <span :class="styles.labelIcon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              Confirm Password
            </label>
            <div :class="styles.inputWrapper">
              <input
                :id="confirmPasswordId"
                v-model="formData.confirmPassword"
                type="password"
                :class="[styles.input, formErrors.confirmPassword ? styles.inputError : '']"
                autocomplete="new-password"
                placeholder="Confirm your password"
                @blur="validateField('confirmPassword')"
                required
              />
              <div :class="styles.inputFocus"></div>
            </div>
            <div v-if="formErrors.confirmPassword" :class="styles.errorMessage">
              {{ formErrors.confirmPassword }}
            </div>
          </div>

          <!-- Enhanced Checkbox for Login -->
          <div v-if="isLogin" :class="styles.checkboxGroup">
            <label :class="styles.checkboxLabel">
              <input
                :id="rememberMeId"
                v-model="formData.rememberMe"
                type="checkbox"
                :class="styles.checkbox"
              />
              <span :class="styles.checkboxCustom">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              Remember me for 30 days
            </label>
          </div>

          <!-- Enhanced Submit Button -->
          <button type="submit" :class="[styles.primaryButton, isSubmitting ? styles.buttonLoading : '']" :disabled="isSubmitting">
            <span v-if="!isSubmitting" :class="styles.buttonContent">
              <span :class="styles.buttonIcon">
                <svg v-if="isLogin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M10 17L15 12L10 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M15 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M20 8V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M23 11H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              {{ isLogin ? 'Sign In' : 'Create Account' }}
            </span>
            <span v-else :class="styles.buttonSpinner">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.3"/>
                <path d="M12 2A10 10 0 0 1 22 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
              </svg>
            </span>
          </button>

          <div v-if="isLogin" :class="styles.forgotPassword">
            <a href="#" :class="styles.secondaryLink">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Forgot your password?
            </a>
          </div>
        </form>
      </div>

      <!-- Right Column - Enhanced Hero Text -->
      <div :class="styles.heroColumn">
        <div :class="styles.heroContent">
          <div :class="styles.heroDecoration">
            <div :class="styles.heroPattern"></div>
          </div>
          
          <h1 :class="styles.heroTitle">
            {{ isLogin ? 'Welcome.' : 'Join Us.' }}
            <span :class="styles.titleAccent">{{ isLogin ? 'Back.' : '' }}</span>
          </h1>
          
          <p :class="styles.heroSubtitle">
            {{
              isLogin
                ? 'Access your PIF dashboard and continue your innovation journey with cutting-edge technology and seamless experiences.'
                : 'Begin your journey with PIF and unlock access to next-generation tools, insights, and innovation platforms designed for the future.'
            }}
          </p>
          
          <div :class="styles.heroFeatures">
            <div :class="styles.feature">
              <span :class="styles.featureIcon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span>Enterprise-grade security</span>
            </div>
            <div :class="styles.feature">
              <span :class="styles.featureIcon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span>Lightning-fast performance</span>
            </div>
            <div :class="styles.feature">
              <span :class="styles.featureIcon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span>Advanced analytics</span>
            </div>
          </div>
          
          <!-- i make comment for this becouse this a demo version -->
           
          <!-- <div :class="styles.authToggle">
            <span :class="styles.toggleText">
              {{ isLogin ? "Don't have an account?" : 'Already have an account?' }}
            </span>
            <button
              type="button"
              :class="styles.toggleButton"
              @click="toggleAuthMode"
            >
              <span :class="styles.toggleIcon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              {{ isLogin ? 'Create new account' : 'Sign in instead' }}
            </button>
          </div> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { PasswordValidator } from '../../services/authService'
import styles from './AuthCard.module.css'

interface Props {
  isLogin?: boolean
}

interface Emits {
  (e: 'toggle-auth-mode'): void
  (e: 'submit', data: any): void
}

const { isLogin = true } = defineProps<Props>()

const emit = defineEmits<Emits>()

// Generate unique IDs for form elements
const usernameId = computed(() => `username-${Math.random().toString(36).substr(2, 9)}`)
const emailId = computed(() => `email-${Math.random().toString(36).substr(2, 9)}`)
const firstNameId = computed(() => `firstname-${Math.random().toString(36).substr(2, 9)}`)
const lastNameId = computed(() => `lastname-${Math.random().toString(36).substr(2, 9)}`)
const passwordId = computed(() => `password-${Math.random().toString(36).substr(2, 9)}`)
const confirmPasswordId = computed(() => `confirm-password-${Math.random().toString(36).substr(2, 9)}`)
const rememberMeId = computed(() => `remember-me-${Math.random().toString(36).substr(2, 9)}`)

// Form state
const showPassword = ref(false)
const isSubmitting = ref(false)

// Form data
const formData = ref({
  // Company fields (for registration)
  companyName: '',
  companyArabicName: '',
  crNumber: '',
  moiNumber: '',
  countryOfIncorporation: '',
  // User fields
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  confirmPassword: '',
  rememberMe: false
})

// Form validation
const formErrors = reactive({
  companyName: '',
  companyArabicName: '',
  crNumber: '',
  moiNumber: '',
  countryOfIncorporation: '',
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  confirmPassword: ''
})

// Validation functions
const validateField = (fieldName: string) => {
  switch (fieldName) {
    case 'companyName':
      if (!isLogin) {
        if (!formData.value.companyName.trim()) {
          formErrors.companyName = 'Company name is required'
        } else if (formData.value.companyName.trim().length > 100) {
          formErrors.companyName = 'Company name must be less than 100 characters'
        } else {
          formErrors.companyName = ''
        }
      }
      break

    case 'companyArabicName':
      if (!isLogin) {
        if (formData.value.companyArabicName && formData.value.companyArabicName.trim().length > 100) {
          formErrors.companyArabicName = 'Arabic company name must be less than 100 characters'
        } else {
          formErrors.companyArabicName = ''
        }
      }
      break

    case 'crNumber':
      if (!isLogin) {
        if (formData.value.crNumber && formData.value.crNumber.trim().length > 50) {
          formErrors.crNumber = 'CR number must be less than 50 characters'
        } else {
          formErrors.crNumber = ''
        }
      }
      break

    case 'moiNumber':
      if (!isLogin) {
        if (formData.value.moiNumber && formData.value.moiNumber.trim().length > 50) {
          formErrors.moiNumber = 'MOI number must be less than 50 characters'
        } else {
          formErrors.moiNumber = ''
        }
      }
      break

    case 'countryOfIncorporation':
      if (!isLogin) {
        if (formData.value.countryOfIncorporation && formData.value.countryOfIncorporation.trim().length > 100) {
          formErrors.countryOfIncorporation = 'Country of incorporation must be less than 100 characters'
        } else {
          formErrors.countryOfIncorporation = ''
        }
      }
      break

    case 'username':
      if (!isLogin) {
        if (!formData.value.username.trim()) {
          formErrors.username = 'Username is required'
        } else if (formData.value.username.length < 3) {
          formErrors.username = 'Username must be at least 3 characters'
        } else if (formData.value.username.length > 30) {
          formErrors.username = 'Username must be less than 30 characters'
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.value.username)) {
          formErrors.username = 'Username can only contain letters, numbers, and underscores'
        } else {
          formErrors.username = ''
        }
      }
      break
    
    case 'email':
      if (!formData.value.email.trim()) {
        formErrors.email = isLogin ? 'Username or email is required' : 'Email address is required'
      } else if (!isLogin && !isValidEmail(formData.value.email)) {
        formErrors.email = 'Please enter a valid email address'
      } else if (isLogin) {
        // For login, accept either email format or username format
        const isEmailFormat = isValidEmail(formData.value.email)
        const isUsernameFormat = /^[a-zA-Z0-9_]+$/.test(formData.value.email)
        if (!isEmailFormat && !isUsernameFormat) {
          formErrors.email = 'Please enter a valid username or email address'
        } else {
          formErrors.email = ''
        }
      } else {
        formErrors.email = ''
      }
      break
    
    case 'firstName':
      if (!isLogin) {
        if (!formData.value.firstName.trim()) {
          formErrors.firstName = 'First name is required'
        } else if (formData.value.firstName.trim().length > 30) {
          formErrors.firstName = 'First name must be less than 30 characters'
        } else {
          formErrors.firstName = ''
        }
      }
      break
    
    case 'lastName':
      if (!isLogin) {
        if (!formData.value.lastName.trim()) {
          formErrors.lastName = 'Last name is required'
        } else if (formData.value.lastName.trim().length > 30) {
          formErrors.lastName = 'Last name must be less than 30 characters'
        } else {
          formErrors.lastName = ''
        }
      }
      break
    
    case 'password':
      if (!formData.value.password) {
        formErrors.password = 'Password is required'
      } else if (!isLogin) {
        const validation = PasswordValidator.validate(formData.value.password)
        if (!validation.isValid) {
          formErrors.password = validation.errors[0] // Show first error
        } else {
          formErrors.password = ''
        }
      } else {
        formErrors.password = ''
      }
      break
    
    case 'confirmPassword':
      if (!isLogin) {
        if (!formData.value.confirmPassword) {
          formErrors.confirmPassword = 'Please confirm your password'
        } else if (formData.value.password !== formData.value.confirmPassword) {
          formErrors.confirmPassword = 'Passwords do not match'
        } else {
          formErrors.confirmPassword = ''
        }
      }
      break
  }
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validateForm = (): boolean => {
  if (isLogin) {
    validateField('email') // For login, this is username or email
    validateField('password')
    return !formErrors.email && !formErrors.password
  } else {
    // Validate company fields
    validateField('companyName')
    validateField('companyArabicName')
    validateField('crNumber')
    validateField('moiNumber')
    validateField('countryOfIncorporation')
    
    // Validate user fields
    validateField('username')
    validateField('email')
    validateField('firstName')
    validateField('lastName')
    validateField('password')
    validateField('confirmPassword')
    
    return !formErrors.companyName && 
           !formErrors.companyArabicName && 
           !formErrors.crNumber && 
           !formErrors.moiNumber && 
           !formErrors.countryOfIncorporation &&
           !formErrors.username && 
           !formErrors.email && 
           !formErrors.firstName && 
           !formErrors.lastName && 
           !formErrors.password && 
           !formErrors.confirmPassword
  }
}

// Methods
// const toggleAuthMode = () => {
//   emit('toggle-auth-mode')
//   // Reset form when toggling
//   formData.value = {
//     username: '',
//     email: '',
//     firstName: '',
//     lastName: '',
//     password: '',
//     confirmPassword: '',
//     rememberMe: false
//   }
  
//   // Clear errors
//   Object.keys(formErrors).forEach(key => {
//     formErrors[key as keyof typeof formErrors] = ''
//   })
// }

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }
  
  isSubmitting.value = true
  
  try {
    // Prepare data based on login/register
    let submitData: any
    
    if (isLogin) {
      submitData = {
        username_or_email: formData.value.email,
        password: formData.value.password,
        rememberMe: formData.value.rememberMe
      }
    } else {
      submitData = {
        // Company information
        name: formData.value.companyName,
        arabic_name: formData.value.companyArabicName || undefined,
        cr_number: formData.value.crNumber || undefined,
        moi_number: formData.value.moiNumber || undefined,
        country_of_incorporation: formData.value.countryOfIncorporation || undefined,
        // User information
        username: formData.value.username,
        email: formData.value.email,
        password: formData.value.password,
        password_confirm: formData.value.confirmPassword,
        first_name: formData.value.firstName,
        last_name: formData.value.lastName
      }
    }
    
    // Debug logging
    console.log('AuthCard submitting:', submitData)
    
    emit('submit', submitData)
  } finally {
    isSubmitting.value = false
  }
}
</script>
