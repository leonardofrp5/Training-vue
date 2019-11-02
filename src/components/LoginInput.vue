<template lang="pug">
  form
    .section-input(v-for='infoInput in infoInputs' :key="infoInput.inputId")
      label(for='name')
        | {{ infoInput.inputLabel }}
      input(:type='infoInput.inputType' v-model="form[0][infoInput.inputName]")
    .section-buttons
      input.button.button-singUp(type="submit" value="Sing Up" @click.prevent="fakeSubmit")
      input.button.button-login(type="submit" value="Login")
      p {{ Object.keys(form) }}
</template>

<script>
export default {
  name: 'LoginInput',
  data: function () {
    return {
      infoInputs: [
        {
          inputId: 1,
          inputName: 'name',
          inputType: 'text',
          inputLabel: 'Nombre',
          vaxlue: '1'
        },
        {
          inputId: 2,
          inputName: 'lastName',
          inputType: 'text',
          inputLabel: 'Apellido'
        },
        {
          inputId: 3,
          inputName: 'email',
          inputType: 'email',
          inputLabel: 'Email'
        },
        {
          inputId: 4,
          inputName: 'password',
          inputType: 'password',
          inputLabel: 'Password'
        },
        {
          inputId: 5,
          inputName: 'confiPassword',
          inputType: 'password',
          inputLabel: 'Confirmación de Password'
        }
      ],
      form: [
        {
          users: {
            name: '',
            lastName: '',
            email: '',
            password: '',
            confiPassword: ''
          }
        }
      ]
    }
  },
  methods: {
    fakeSubmit () {
      console.log(this.form)
    }
  }
}
</script>

<style scoped lang="scss">
@import '../scss/variables/colors';

.section-input{
  display: flex;
  flex-direction: column;
  padding: 10px 25px;

  label{
    display: flex;
    font-family: 'Roboto', sans-serif;
    size: 16px;
    padding-bottom: 5px;
    padding-top: 5px;
    color: $Black;
  }

  input{
    border: none;
    border-radius: 5px;
    height: 32px;
    width: 252px;
  }
}

.button{
  width: 252px;
  height: 32px;
  border-radius: 5px;
  font-size: 16px;
}

.button-singUp{
  background-color: $Earls-Green;
  color: $white;
}

.button-login{
  border: solid 2px $Earls-Green;
  color: $Earls-Green;
}

.section-buttons{
  align-items: center;
  display: flex;
  flex-direction: column;
  height: 120px;
  justify-content: space-around;
  position: relative;

  &:before{
    background-color: $Silver-Chalice;
    content: '';
    position: absolute;
    height: 2px;
    width: 80%;
  }
}
</style>
