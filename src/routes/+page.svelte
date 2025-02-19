<script>
    import Card from "$lib/Card.svelte";
    import Timecard from "$lib/Timecard.svelte";
    import Nav from "$lib/Nav.svelte";
    import Globe from "../lib/Globe.svelte";
    import Cocktail from "$lib/Cocktail.svelte";
    import DailyMessage from "$lib/DailyMessage.svelte";
  </script>
  
  <main>
    <Nav />
    <div class="wrapper">
    <Globe />
  </div>
    <!-- <Card /> -->
  <div class="bottom-section">
    <div class="cardstyle">
    <Card />
  </div>
  <div class="cardstyle">
    <Timecard />
  </div>
  </div>
  <div class="text-rotate">
    rotate<br>globe
  </div>
  
  <div class="text-scroll">
    scroll<br>here
  </div>
  <DailyMessage />
  <Cocktail />
  <div class="footer-section">
    <div class="first">
  <p class="sign">designed by Franz Anhäupl</p>
  <p class="sign">developed by Franz Anhäupl</p>
</div>
<div class="second">
  <p class="sign">for his hardworking babe ❤️</p>
</div>
</div>
  </main>

  <style>
  

@font-face {
    font-family: "Space Grotesk";
    src: url("/fonts/Spacegrotesk/SpaceGrotesk-Regular.ttf") format("truetype");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
  font-family: "Space Grotesk";
  src: url("/fonts/Spacegrotesk/SpaceGrotesk-Bold.ttf") format("truetype");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
.sign {
  font-size: 1rem;
  color: white;
}
.footer-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100vw;
  align-items: center;
  padding-bottom: 60px;
  margin-top: -60px;
}
  
.text-rotate {
  position: absolute;
    top: 30vh;
    left: 1rem;
    color: white;
    font-size: 0.8rem;
    line-height: 0.9;
    opacity: 0.7;
  }

  /* Text auf 55% VH */
  .text-scroll {
    position: absolute;
    top: 65vh;
    left: 1rem;
    color: white;
    font-size: 0.8rem;
    line-height: 0.9;
    opacity: 0.7;
  }



:global(html, body) {
  margin: 0;
  padding: 0;
  background-color: #000106; /* Schwarz */
  height: 100%;
  width: 100%;
  font-family: "Space Grotesk", sans-serif;
  font-weight: 400;
}

* {
  margin: 0;
  padding: 0;
}
.bottom-section {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: space-evenly;
      width: 100vw;
      height: 100vh;
      background-color: #000106;
    }

.cardstyle {
  display: flex;
  align-items: stretch;

}

    .wrapper {
      height: 55vh;
      width: 100vw;
    }


  </style>
  