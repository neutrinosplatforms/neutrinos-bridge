/*
=====HTML ELEMENT=====
To pu inside the page where you want to display the breadcrumb trail

<div class="BreadcrumbContainer">
  <div class="BreadcrumbStepContainer StepCompleted">
    <div class="BreadcrumbStepText">Approve relay as operator</div>
    <div class="BreadcrumbStepArrow"></div>
  </div>
  <div class="BreadcrumbStepLink"></div>

  <div class="BreadcrumbStepContainer StepCompleted">
    <div class="BreadcrumbStepText">Sign migration hash</div>
    <div class="BreadcrumbStepArrow"></div>
  </div>
  <div class="BreadcrumbStepLink"></div>

  <div class="BreadcrumbStepContainer">
    <div class="BreadcrumbStepText">Sign escrow hash</div>
    <div class="BreadcrumbStepArrow"></div>
  </div>
  <div class="BreadcrumbStepLink"></div>

  <div class="BreadcrumbStepContainer">
    <div class="BreadcrumbStepText">Finished</div>
  </div>
</div>

*/
/* Autonomous custom element */
const breadcrumbStruct = () => {
  let htmlContent = {};
  htmlContent.innerHTML = `<div class="BreadcrumbContainer">
    <div class="BreadcrumbStepContainer StepCompleted">
      <div class="BreadcrumbStepText">Approve relay as operator</div>
      <div class="BreadcrumbStepArrow"></div>
    </div>
    <div class="BreadcrumbStepLink"></div>

    <div class="BreadcrumbStepContainer StepCompleted">
      <div class="BreadcrumbStepText">Sign migration hash</div>
      <div class="BreadcrumbStepArrow"></div>
    </div>
    <div class="BreadcrumbStepLink"></div>

    <div class="BreadcrumbStepContainer">
      <div class="BreadcrumbStepText">Sign escrow hash</div>
      <div class="BreadcrumbStepArrow"></div>
    </div>
    <div class="BreadcrumbStepLink"></div>

    <div class="BreadcrumbStepContainer">
      <div class="BreadcrumbStepText">Finished</div>
    </div>
  </div>`;
  return htmlContent.innerHTML;/* Using htmlContent variable is to have the synthax coloration for HTML*/
}

const breadcrumbStyle = () => {
  let cssStyle = document.createElement('style');
  cssStyle.textContent = '.BreadcrumbContainer{
    font-size: 0.75em;
    justify-content: center;/* Center horizontally */

    /* Horiz display*/
    display: flex;
    flex-flow: row nowrap;
    gap: 0em 0em;
    align-items: center;
    justify-content: center;
  }

  .BreadcrumbStepContainer{
    position: relative;

    border-style: dashed;
    border-color: #af1540;
    border-width: 1px;
    border-radius: 100%;
    height: 7em;
    width: 7em;

    display: flex;
    align-items: center;/* Center vertic*/
    justify-content: center;
  }

  .BreadcrumbStepText{
    line-height: 1.56rem;
    text-align: center;
    word-break: break-word;
    color: #666;
    font-weight: 300;
    margin: 1em;
  }

  /*the appearance of the BC step once completed */
  .StepCompleted{
    border-style: solid;
    border-color: #af1540;
    border-width: 2px;
  }

  /* the appearance of the text inside a completed step */
  .StepCompleted .BreadcrumbStepText{
    color: #333;
    font-weight: 600;
  }

  /*=====Strait line=====*/
  .BreadcrumbStepLink{
    /* position: absolute; */
    width: 5vw;
    height: 2px;
    border-top: 1px dashed #af1540;
  }
  .StepCompleted + .BreadcrumbStepLink{
    border-top: 2px solid #af1540;
  }


  /*=====Arrow=====*/
  .BreadcrumbStepArrow{
    position: absolute;
    left: calc(6.25em + 2.5vw);
    width: 1.5em;
    height: 1.5em;
  }
  .BreadcrumbStepArrow::before, .BreadcrumbStepArrow::after{
    position: absolute;
    content: "";
    width: 1px;
    height: 100%;
  }
  .BreadcrumbStepArrow::before{
    left: 0px;
    top: -0.5em;
    transform: rotate(-45deg);
    background-color: #af1540;
  }
  .BreadcrumbStepArrow::after{
    left: 0px;
    top: 0.5em;
    transform: rotate(45deg);
    background-color: #af1540;
  }
  .StepCompleted > .BreadcrumbStepArrow::before{
    width: 2px;
  }
  .StepCompleted > .BreadcrumbStepArrow::after{
    width: 2px;
  }
';
  return cssStyle.innerHTML;/* Using htmlContent variable is to have the synthax coloration for HTML*/
}

export default class BreadcrumbTrail extends HTMLElement {
  constructor() {
    super();

    // Create a shadow root
    this.attachShadow({mode: 'open'}); // sets and returns 'this.shadowRoot'

    const container = document.createElement('breadcrumbTrailContainer');
    container.innerHTML = breadcrumbStruct();
    this.shadowRoot.appendChild(container);

  }
}

/* Display the validated steps.
stepId = 0 means no step validated.
stepId = 1 means the first step validated.

let setBreadcrumbStep = function(stepId){

}*/
