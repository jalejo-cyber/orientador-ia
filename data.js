window.ORIENTA = {
  families: [
    {
      id: "ADMIN",
      title: "Administració i gestió",
      desc: "Feines d’oficina, atenció al client, gestió documental, suport administratiu.",
      icon: "briefcase",
      tasks: [
        { id:"factures", label:"Facturació i suport comptable", hint:"Factures, albarans, caixa, cobraments/pagaments" },
        { id:"arxiu", label:"Arxiu i gestió documental", hint:"Registre, organització, digitalització" },
        { id:"atencio", label:"Atenció al client", hint:"Recepció, telefonia, correu, incidències" },
        { id:"ofimatica", label:"Ofimàtica / Excel", hint:"Fulls de càlcul, bases de dades, CRM" },
        { id:"comandes", label:"Gestió de comandes", hint:"Seguiment, proveïdors, coordinació" },
        { id:"rrhh", label:"Suport RRHH", hint:"Altes/baixes, documentació, control horari" }
      ],
      quals: [
        { code:"ADGG0408", name:"Operacions auxiliars de serveis administratius i generals", level:1, minYears:0.5,
          keywords:["arxiu","documentacio","recepcio","registre","oficina"], taskIds:["arxiu","atencio","ofimatica"] },
        { code:"ADGG0208", name:"Activitats administratives en la relació amb el client", level:2, minYears:1.5,
          keywords:["atencio","client","comandes","factures","crm","incidencies"], taskIds:["atencio","comandes","ofimatica","factures"] },
        { code:"ADGD0308", name:"Activitats de gestió administrativa", level:3, minYears:2.5,
          keywords:["gestio","procediments","rrhh","organitzacio","pressupostos"], taskIds:["factures","rrhh","arxiu","ofimatica"] }
      ]
    },

    {
      id: "HOST",
      title: "Hostaleria i turisme",
      desc: "Servei de sala, barra, cuina, reserves i higiene alimentària (APPCC).",
      icon: "utensils",
      tasks: [
        { id:"sala", label:"Servei de sala", hint:"Comandes, servei, protocol, al·lèrgens" },
        { id:"barra", label:"Barra i begudes", hint:"Cafeteria, combinats bàsics, tiratge" },
        { id:"cuina", label:"Cuina", hint:"Mise en place, elaboracions, conservació" },
        { id:"higiene", label:"Higiene i APPCC", hint:"Neteja, temperatures, traçabilitat" },
        { id:"recepcio", label:"Recepció / reserves", hint:"Check-in, reserves, atenció client" },
        { id:"estoc", label:"Comandes i estoc", hint:"Inventari, proveïdors, càmeres" }
      ],
      quals: [
        { code:"HOTR0208", name:"Operacions bàsiques de restaurant i bar", level:1, minYears:0.5,
          keywords:["sala","barra","servei","neteja","alergens"], taskIds:["sala","barra","higiene"] },
        { code:"HOTR0408", name:"Cuina", level:2, minYears:1.5,
          keywords:["cuina","miseenplace","appcc","tracabilitat","conservacio"], taskIds:["cuina","higiene","estoc"] },
        { code:"HOTA0108", name:"Direcció i producció en cuina", level:3, minYears:2.5,
          keywords:["organitzacio","escandalls","costos","planificacio","equips"], taskIds:["cuina","estoc","higiene"] }
      ]
    },

    {
      id: "SANI",
      title: "Sanitat / Atenció sociosanitària",
      desc: "Cures bàsiques, ABVD, mobilitzacions, suport domiciliari i institucional.",
      icon: "heart",
      tasks: [
        { id:"abvd", label:"Higiene i suport ABVD", hint:"Bany, vestir, alimentació, mobilització" },
        { id:"mobilitzacions", label:"Mobilitzacions i transferències", hint:"Canvis posturals, grua, prevenció caigudes" },
        { id:"domicili", label:"Suport a la llar", hint:"Àpats, neteja, compres, recordatori medicació" },
        { id:"psicosocial", label:"Acompanyament i suport psicosocial", hint:"Rutines, estimulació, comunicació" },
        { id:"registres", label:"Registres i coordinació", hint:"Incidències, parts, equip" },
        { id:"cures", label:"Cures bàsiques", hint:"Higiene, prevenció, cures simples segons rol" }
      ],
      quals: [
        { code:"SSCS0108", name:"Atenció sociosanitària a persones en el domicili", level:2, minYears:1.0,
          keywords:["domicili","abvd","cures","llar","acompanyament"], taskIds:["domicili","abvd","psicosocial","registres"] },
        { code:"SSCS0208", name:"Atenció sociosanitària en institucions socials", level:2, minYears:1.5,
          keywords:["dependencia","institucio","abvd","grua","geriatria","mobilitzacions"], taskIds:["abvd","mobilitzacions","psicosocial","registres"] },
        { code:"SSCG0111", name:"Gestió de crides i suport en serveis socials (orientatiu)", level:3, minYears:2.5,
          keywords:["coordinacio","plans","seguiment","organitzacio","equip"], taskIds:["registres","psicosocial"] }
      ]
    },

    {
      id: "COMER",
      title: "Comerç i màrqueting",
      desc: "Venda, caixa/TPV, reposició, magatzem i atenció al client.",
      icon: "cart",
      tasks: [
        { id:"tpv", label:"Caixa i TPV", hint:"Cobrament, devolucions, tancament" },
        { id:"venda", label:"Venda i assessorament", hint:"Atenció, reclamacions, objectius" },
        { id:"reposicio", label:"Reposició i lineal", hint:"Merchandising, etiquetatge, planogrames" },
        { id:"magatzem", label:"Magatzem", hint:"Recepció, inventari, picking" },
        { id:"comandes", label:"Comandes i proveïdors", hint:"Albarans, incidències, seguiment" },
        { id:"online", label:"Venda online (bàsic)", hint:"Comandes web, devolucions, atenció digital" }
      ],
      quals: [
        { code:"COMT0211", name:"Activitats auxiliars de comerç", level:1, minYears:0.5,
          keywords:["reposicio","magatzem","tpv","etiquetatge","atencio"], taskIds:["reposicio","magatzem","tpv","venda"] },
        { code:"COMV0108", name:"Activitats de venda", level:2, minYears:1.0,
          keywords:["venda","assessorament","client","devolucions","objectius"], taskIds:["venda","tpv"] },
        { code:"COMM0112", name:"Gestió de màrqueting i comunicació (orientatiu)", level:3, minYears:2.5,
          keywords:["campanyes","comunicacio","estrategia","rrss","analitica"], taskIds:["online"] }
      ]
    }
  ]
};
