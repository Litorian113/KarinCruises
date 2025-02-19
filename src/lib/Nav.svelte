<script>
    // Falls du noch Props oder State brauchst, hier rein
  </script>
  
  <style>
    .navbar {
      width: 100vw;
      height: 60px;           /* gewünschte Höhe */
      background-color: #000106; /* beliebige Hintergrundfarbe */
      display: flex;
      align-items: center;    /* vertikale Zentrierung */
      justify-content: center;/* horizontale Zentrierung */
      position: relative;        /* bleibt oben kleben */
      top: 0;                 /* am oberen Bildschirmrand */
      left: 0;
      z-index: 999;           /* über anderen Elementen */
    }
  
    .logo {
      height: 40px;           /* beliebige Logo-Höhe */
      object-fit: contain;    /* bei Bedarf Bildanpassung */
    }
  </style>
  
  <header class="navbar">
    <img src="/Logo.png" alt="Logo" class="logo" />
  </header>
  