import { jsonIgnoreProperty, jsonPropertyName } from "./json-parser";

export class TestClass {
  @jsonIgnoreProperty()
  private ignoredProperty: boolean = false;

  @jsonPropertyName("prop1")
  private prop1: string = "PROP_1";

  @jsonPropertyName("prop2")
  private prop2: string = "PROP_2";

  public prop3: string = "PROP_3";
}