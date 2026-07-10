package com.talentotech.gestortareas.model;

/**
 * Los 3 roles de la app, de mayor a menor alcance:
 *  - ADMIN: ve todo, designa PMs y arma los equipos (asigna usuarios a un PM).
 *    No hay alta publica de ADMIN: el primero se marca a mano en la base
 *    (ver README).
 *  - PM: crea proyectos. Solo el y su equipo asignado ven esos proyectos.
 *  - USER: rol por defecto al registrarse. Ve los proyectos del PM al que
 *    el ADMIN lo asigno.
 */
public enum Rol {
    ADMIN,
    PM,
    USER
}
